export interface Server {
  name: string;
  host: string;
  id: string;
  ver: string;
  jetstream: boolean;
  flags: number;
  seq: number;
  time: string;
}

