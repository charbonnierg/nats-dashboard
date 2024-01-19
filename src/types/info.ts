import type { Varz } from "./varz";
import type { Connz, ConnzOptions } from "./connz";
import type { Routez, RoutezOptions } from "./routez";
import type { Gatewayz, GatewayzOptions } from "./gatewayz";
import type { Leafz, LeafzOptions } from "./leafz";
import type { Subsz, SubszOptions } from "./subsz";
import type { Accountz, AccountzOptions } from "./accountz";
import type { AccountStatz, AccountStatzOptions } from "./accstatz";
import type { Jsz, JszOptions } from "./jsz";
import type { Healthz, HealthzOptions } from "./healthz";
import type { Server } from "./server";
import type { Statz } from "./statz";
import type { EndpointError } from "./error";

/** NATS server monitoring endpoint. */
export type Endpoint =
  | "statz" // Ping the servers.
  | "varz" // General information.
  | "connz" // Connection information.
  | "routez" // Route information.
  | "gatewayz" // Gateway information.
  | "leafz" // Leaf node information.
  | "subsz" // Subscription routing information.
  | "accountz" // Account information.
  | "accstatz" // Account statistics.
  | "jsz" // JetStream information.
  | "healthz"; // Server health.

/** Endpoints that return the server date in their responses. */
export type EndpointWithDate = Exclude<Endpoint, "healthz">;

/** NATS server monitoring endpoint options. */
export type EndpointOptions = {
  statz: undefined; // No options.
  varz: undefined; // No options.
  connz: ConnzOptions;
  routez: RoutezOptions;
  gatewayz: GatewayzOptions;
  leafz: LeafzOptions;
  subsz: SubszOptions;
  accountz: AccountzOptions;
  accstatz: AccountStatzOptions;
  jsz: JszOptions;
  healthz: HealthzOptions;
};

/** NATS server monitoring responses by endpoint. */
export type EndpointResponse = {
  statz: Statz;
  varz: Varz;
  connz: Connz;
  routez: Routez;
  gatewayz: Gatewayz;
  leafz: Leafz;
  subsz: Subsz;
  accountz: Accountz;
  accstatz: AccountStatz;
  jsz: Jsz;
  healthz: Healthz;
};

/** A response returned by a single server on a SYS monitoring endpoint */
export interface ServerPingResponse<T extends Endpoint> {
  server: Server;
  data: EndpointResponse[T];
  error?: null;
}

/** An error returned by a single server on a SYS monitoring endpoint */
export interface ServerPingError {
  server: Server;
  error: EndpointError;
  data?: null;
}

/** NATS server SYS ping responses by endpoint. */
export type EndpointPingResponse = {
  [K in Endpoint]: ServerPingResponse<K>[];
};

/** Union of all the monitoring options */
export type MonitoringOption = EndpointOptions[Endpoint]
/** Union of all the monitoring endpoint responses. */
export type MonitoringResponse = EndpointResponse[Endpoint];
/** Union of all the ping endpoint responses. */
export type PingResponse = EndpointPingResponse[Endpoint];
