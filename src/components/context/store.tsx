import { createStore } from "solid-js/store";
import {
  type NatsConnection,
  type ConnectionOptions,
  connect,
  credsAuthenticator,
} from "nats.ws";
import { createContext, useContext, type ParentProps } from "solid-js";

interface NatsClientOpts {
  username: string | undefined;
  password: string | undefined;
  token: string | undefined;
  creds: string | undefined;
}

interface StoreState {
  url: string;
  active: boolean;
  serverId: string;
  options: NatsClientOpts;
  connection: NatsConnection | null;
}

interface StoreActions {
  setActive(active: boolean): void;
  toggleActive(): void;
  setURL(url: string): void;
  setServerId(serverId: string): void;
  setUsername(username: string): void;
  setPassword(password: string): void;
  setToken(token: string): void;
  setCreds(creds: string): void;
}

const defaultStore: StoreState = {
  url: "",
  active: false,
  serverId: "",
  options: {
    username: undefined,
    password: undefined,
    token: undefined,
    creds: undefined,
  },
  connection: null,
};

const defaultActions: StoreActions = {
  setActive() {},
  setURL() {},
  toggleActive() {},
  setServerId() {},
  setUsername() {},
  setPassword() {},
  setToken() {},
  setCreds() {},
};

export type AppStore = [state: StoreState, actions: StoreActions];

const StoreContext = createContext<AppStore>([defaultStore, defaultActions]);

interface Props {
  initialState?: StoreState;
}

export function StoreProvider(props: ParentProps<Props>) {
  const [state, setState] = createStore<StoreState>(
    props.initialState ?? defaultStore,
  );

  const actions: StoreActions = {
    setActive(active: boolean) {
      setState("active", active);
    },
    toggleActive() {
      if (state.url == "") {
        setState("active", false);
        return;
      }
      setState("active", (a) => !a);
      if (state.active) {
        if (state.connection) {
          state.connection.close();
        }
        if (state.url.startsWith("ws://") || state.url.startsWith("wss://")) {
          const opts = {
            servers: state.url,
            user: state.options.username,
            pass: state.options.password,
            token: state.options.token,
          } as ConnectionOptions;
          if (state.options.creds) {
            opts.authenticator = credsAuthenticator(
              new TextEncoder().encode(state.options.creds),
            );
          }
          connect(opts).then(
            (connection) => {
              setState("connection", connection);
              if (connection?.info) {
                setState("serverId", connection.info.server_id);
              }
            },
            (err) => {
              console.log("Failed to connect to " + state.url);
              console.error(err);
              setState("active", false);
            },
          );
        }
      }
    },
    setURL(url: string) {
      setState("url", url);
    },
    setServerId(serverId: string) {
      setState("serverId", serverId);
    },
    setUsername(username: string) {
      setState("options", {
        ...state.options,
        username,
        token: undefined,
        creds: undefined,
      });
    },
    setPassword(password: string) {
      setState("options", {
        ...state.options,
        password,
        token: undefined,
        creds: undefined,
      });
    },
    setToken(token: string) {
      setState("options", {
        ...state.options,
        token,
        username: undefined,
        password: undefined,
        creds: undefined,
      });
    },
    setCreds(creds: string) {
      setState("options", {
        ...state.options,
        creds,
        username: undefined,
        password: undefined,
        token: undefined,
      });
    },
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
