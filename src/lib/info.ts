import type {
  Endpoint,
  EndpointOptions,
  EndpointPingResponse,
  EndpointResponse,
  MonitoringOption,
  ServerPingError,
  ServerPingResponse,
} from "~/types";
import { type NatsConnection, JSONCodec } from "nats.ws";
import { jsonp } from "~/lib/jsonp";
import { isError } from "./guards";

var js = JSONCodec();

/** Options to provide when fetching monitoring info */
interface FetchInfoOptions<T extends Endpoint> {
  /** NATS monitoring server URL. */
  url: string;
  /** Use nats.ws connection instead of HTTP endpoints */
  nc: NatsConnection | null;
  /** NATS server ID (used only when nc is defined) */
  serverId: string;
  /** Endpoint to fetch. */
  endpoint: T;
  /** Endpoint arguments. */
  args?: EndpointOptions[T] | undefined;
  /** Use JSONP requests to fetch the data (used with HTTP only). */
  jsonp?: boolean;
  /** Abort signal (used with HTTP only). */
  signal?: AbortSignal;
}

/** Fetch monitoring information for a NATS server by type. */
export async function fetchInfo<T extends Endpoint>({
  url: baseURL,
  nc,
  serverId,
  endpoint,
  args,
  jsonp = false,
  signal,
}: FetchInfoOptions<T>): Promise<EndpointResponse[T]> {
  if (baseURL.startsWith("ws") || baseURL.startsWith("wss")) {
    if (nc) {
      const result = await requestData(nc, serverId, endpoint, args)
      return result.data;
    }
    throw new Error("No NATS connection");
  }
  const url = new URL(endpoint, baseURL);

  if (args) {
    const params = new URLSearchParams(args);
    url.search = params.toString();
  }

  return fetchData<EndpointResponse[T]>(url.href, {
    jsonp,
    signal,
  });
}

/** Options to provide when fetching monitoring info using HTTP */
interface FetchDataOptions {
  jsonp?: boolean;
  signal?: AbortSignal | undefined | null;
}

/** Fetch the server data using either JSONP requests or the Fetch API. */
async function fetchData<T>(
  url: string,
  { jsonp: useJSONP = false, signal = null }: FetchDataOptions
): Promise<T> {
  // Required for NATS servers prior to v2.9.22.
  if (useJSONP) {
    return jsonp(url, { signal });
  }

  const response = await fetch(url, { signal });
  return response.json();
}

/** Encode options to be sent as NATS message payload. */
function encodeOptions(args: MonitoringOption): Uint8Array {
  if (!args) {
    return js.encode({});
  }
  const jsonArgs = {} as any;
  for (const [key, value] of Object.entries(args)) {
    switch (key) {
      case "state":
        switch (value) {
          case "open":
            jsonArgs[key] = 0;
            break;
          case "closed":
            jsonArgs[key] = 1;
            break;
          case "any":
            jsonArgs[key] = 2;
            break;
          default:
            throw new Error(`Invalid state option: ${value}`);
        }
        break;
      case "consumers":
        jsonArgs["consumer"] = value;
        break;
      default:
        jsonArgs[key] = value;
        break;
    }
  }
  return js.encode(jsonArgs);
}

/** Decode reply data received on NATS */
function decodeReply<T extends Endpoint>(data: Uint8Array): ServerPingResponse<T> {
  if (data.length == 0) {
    throw new Error("No data");
  }
  const r = js.decode(data) as ServerPingResponse<T> | ServerPingError;
  if (isError(r)) {
    throw new Error(r.error.description);
  }
  return r;
}

/** Fetch the server data using NATS request/reply. */
async function requestData<T extends Endpoint>(
  nc: NatsConnection,
  serverId: string,
  endpoint: T,
  args: EndpointOptions[T]
): Promise<ServerPingResponse<T>> {
  const ep = `$SYS.REQ.SERVER.${serverId.toUpperCase()}.${endpoint.toUpperCase()}`;
  const payload = encodeOptions(args);
  const reply = await nc.request(ep, payload, { timeout: 1000 });
  return decodeReply<T>(reply.data);
}

/** Fetch many servers data using NATS requestMany */
export async function requestManyData<T extends Endpoint>(
  nc: NatsConnection,
  endpoint: T,
  args: EndpointOptions[T]
): Promise<EndpointPingResponse[T]> {
  const ep = endpoint === "statz"  ?
    `$SYS.REQ.SERVER.PING` :
    `$SYS.REQ.SERVER.PING.${endpoint.toUpperCase()}`;
  const payload = encodeOptions(args);
  const replies = await nc.requestMany(ep, payload, { maxWait: 1000 });
  const data = [] as EndpointPingResponse[T];
  for await (const reply of replies) {
    try {
      const r = decodeReply<T>(reply.data);
      data.push(r);
    } catch (err) {
      console.log(`error monitoring server ${reply.subject} ${err.message}`);
    }
  }
  return data;
}
