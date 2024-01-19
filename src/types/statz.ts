import type { JetStreamConfig, JetStreamStats } from "./common";

export interface MsgStatz {
    msgs: number;
    bytes: number;
}

export interface JetStreamStatz {
    config: JetStreamConfig;
    stats: JetStreamStats;
}

export interface Statz {
  start: string;
  mem: number;
  cores: number;
  cpu: number;
  connections: number;
  total_connections: number;
  active_accounts: number;
  subscriptions: number;
  sent: MsgStatz;
  received: MsgStatz;
  slow_consumers: number;
  active_servers: number;
  jetstream?: JetStreamStatz;
}