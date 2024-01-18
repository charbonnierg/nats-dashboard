import { createStore } from 'solid-js/store';
import { type NatsConnection, connect } from 'nats.ws'
import { createContext, useContext, type ParentProps } from 'solid-js';

interface StoreState {
  url: string;
  active: boolean;
  serverId: string;
  connection: NatsConnection | null
}

interface StoreActions {
  setActive(active: boolean): void;
  toggleActive(): void;
  setURL(url: string): void;
  setServerId(serverId: string): void;
}

const defaultStore: StoreState = {
  url: '',
  active: false,
  serverId: '',
  connection: null
};

const defaultActions: StoreActions = {
  setActive() {},
  setURL() {},
  toggleActive() {},
  setServerId() {}
};

export type AppStore = [state: StoreState, actions: StoreActions];

const StoreContext = createContext<AppStore>([defaultStore, defaultActions]);

interface Props {
  initialState?: StoreState;
}

export function StoreProvider(props: ParentProps<Props>) {
  const [state, setState] = createStore<StoreState>(
    props.initialState ?? defaultStore
  );

  const actions: StoreActions = {
    setActive(active: boolean) {
      setState('active', active);
    },
    toggleActive() {
      setState('active', (a) => !a);
    },
    setURL(url: string) {
      setState('url', url);
      if (state.connection) {
        console.log("closing connection")
        state.connection.close();
      }
      if (url.startsWith("ws://") || url.startsWith("wss://")) {
      console.log("Connecting to " + url)
      connect({servers: url}).then((connection) => {
        console.log("Connected to " + url)
        setState('connection', connection);
        setState('serverId', connection.info.server_id)
      });
    }},
    setServerId(serverId: string) {
      setState('serverId', serverId);
    }
  };

  return (
    <StoreContext.Provider value={[state, actions]}>
      {props.children}
    </StoreContext.Provider>
  );
}

export function useStore(): AppStore {
  return useContext(StoreContext);
}
