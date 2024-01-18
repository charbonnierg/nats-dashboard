import type { Endpoint, EndpointOptions, EndpointResponse } from '~/types';
import { jsonp } from '~/lib/jsonp';
import { type NatsConnection, JSONCodec } from 'nats.ws'

var js = JSONCodec()

interface FetchInfoOptions<T extends Endpoint> {
  /** NATS monitoring server URL. */
  url: string;
  /** NATS connection */
  nc: NatsConnection | null;
  /** NATS server ID */
  serverID: string;
  /** Endpoint to fetch. */
  endpoint: T;
  /** Endpoint arguments. */
  args?: EndpointOptions[T] | undefined;
  /** Use JSONP requests to fetch the data. */
  jsonp?: boolean;
  /** Abort signal. */
  signal?: AbortSignal;
}

/** Fetch monitoring information for a NATS server by type. */
export function fetchInfo<T extends Endpoint>({
  url: baseURL,
  nc,
  serverID,
  endpoint,
  args,
  jsonp = false,
  signal,
}: FetchInfoOptions<T>): Promise<EndpointResponse[T]> {
  if (baseURL.startsWith('ws') || baseURL.startsWith('wss')) {
  if (nc) {
    return requestData(nc, serverID, endpoint, args)
  }
  throw new Error('No NATS connection')
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


async function requestData<T>(
  nc: NatsConnection,
  serverId: string,
  endpoint: string,
  args: any,
): Promise<T> {
  const ep = `$SYS.REQ.SERVER.${serverId.toUpperCase()}.${endpoint.toUpperCase()}`
  const jsonArgs = {}
  for (const [key, value] of Object.entries(args)) {
    if (key == "state") {
      switch (value) {
        case "open":
          jsonArgs[key] = 0
          break
        case "closed":
          jsonArgs[key] = 1
          break
        case "any":
          jsonArgs[key] = 2
          break
      }
      throw("invalid state option")
    }
    if (key == "consumers") {
      jsonArgs["consumer"] = value
      continue
    }
    jsonArgs[key] = value
  }
  const payload = js.encode(jsonArgs)
  const reply = await nc.request(ep, payload, { timeout: 1000 })
  if (reply.data == null) {
    return {} as T
  }
  const data = js.decode(reply.data) as T;
  if (data["data"]) {
    return data["data"]
  }
  if (data["error"]) {
    throw new Error(JSON.stringify(data["error"]))
  }
  return data
}
