import { useSettings } from "~/components/context/settings";
import {
  SettingsHeader,
  SettingsBody,
  SettingSection,
} from "~/components/dashboard/Settings";
import Select, { type Options } from "~/components/Select";
import Toggle from "~/components/Toggle";
import { useStore } from "../context/store";
import { usePingStatz } from "./queries";

const intervalOptions: Options<number> = [
  { value: 100, label: "100ms" },
  { value: 250, label: "250ms" },
  { value: 500, label: "500ms" },
  { value: 1000, label: "1s" },
  { value: 2000, label: "2s" },
  { value: 3000, label: "3s" },
  { value: 5000, label: "5s" },
  { value: 10000, label: "10s" },
  { value: 20000, label: "20s" },
  { value: 30000, label: "30s" },
];

export default function AppSettings() {
  const [settings, actions] = useSettings();
  const [store, storeActions] = useStore();
  const discoveredServers = usePingStatz();
  const readFile = (evt: any): void => {
    var files = evt.currentTarget.files;
    var file = files[0];
    var reader = new FileReader();
    reader.onload = function (event) {
      if (!event.target) return;
      storeActions.setCreds(event.target.result as string);
    };
    reader.readAsText(file, "UTF-8");
  };

  return (
    <div>
      <SettingsHeader
        title="App Settings"
        description="Customize the data fetching settings."
      />
      <SettingsBody>
        <SettingSection title="Polling Interval">
          <Select
            options={intervalOptions}
            value={settings.interval}
            onChange={actions.setInterval}
          />
        </SettingSection>
        {discoveredServers.status == "success" && (
          <SettingSection title="Server">
            <Select
              options={discoveredServers.data.map((srv) => ({
                value: srv.server.id,
                label: srv.server.name,
                disabled: false,
              }))}
              value={store.serverId}
              onChange={storeActions.setServerId}
            />
          </SettingSection>
        )}
        {store.url.startsWith("wss://") || store.url.startsWith("ws://") ? (
          <>
            <SettingSection title="User/Password authentication">
              <input
                id="nats-username"
                class="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 dark:bg-transparent dark:text-white dark:placeholder:text-gray-500 focus:ring-0 sm:text-sm disabled:cursor-not-allowed disabled:text-gray-500 dark:disabled:text-gray-400"
                disabled={store.active}
                placeholder="Enter a username"
                type="text"
                spellcheck={false}
                list="user-list"
                value={store.options.username ? store.options.username : ""}
                onInput={(e) => {
                  storeActions.setUsername(e.target.value);
                }}
              />
              <input
                id="nats-password"
                class="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 dark:bg-transparent dark:text-white dark:placeholder:text-gray-500 focus:ring-0 sm:text-sm disabled:cursor-not-allowed disabled:text-gray-500 dark:disabled:text-gray-400"
                disabled={store.active}
                placeholder="Enter a password"
                type="password"
                spellcheck={false}
                value={store.options.password ? store.options.password : ""}
                onInput={(e) => {
                  storeActions.setPassword(e.target.value);
                }}
              />
            </SettingSection>
            <SettingSection title="Token authentication">
              <input
                id="nats-token"
                class="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 dark:bg-transparent dark:text-white dark:placeholder:text-gray-500 focus:ring-0 sm:text-sm disabled:cursor-not-allowed disabled:text-gray-500 dark:disabled:text-gray-400"
                disabled={store.active}
                placeholder="Enter a token"
                type="password"
                spellcheck={false}
                value={store.options.token ? store.options.token : ""}
                onInput={(e) => {
                  storeActions.setToken(e.target.value);
                }}
              />
            </SettingSection>
            <SettingSection title="Credential file authentication">
              <input
                id="nats-credentials"
                class="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 dark:bg-transparent dark:text-white dark:placeholder:text-gray-500 focus:ring-0 sm:text-sm disabled:cursor-not-allowed disabled:text-gray-500 dark:disabled:text-gray-400"
                disabled={store.active}
                placeholder="Select a file"
                type="file"
                onInput={readFile}
              />
            </SettingSection>
          </>
        ) : (
          <>
            <SettingSection
              title="JSONP Requests"
              description={
                <>
                  Required for NATS server prior to{" "}
                  <span class="font-bold">v2.9.22</span>
                </>
              }
            >
              <Toggle checked={settings.jsonp} onChange={actions.setJSONP} />
            </SettingSection>
          </>
        )}
      </SettingsBody>
    </div>
  );
}
