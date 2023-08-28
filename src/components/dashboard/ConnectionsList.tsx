import { createSignal, createMemo, Switch, Match, For, Show } from 'solid-js';

import type { ConnState, ConnzSortOpt, SubsOption } from '~/types';
import { useStore } from '~/components/context/store';
import { useSettings } from '~/components/context/settings';
import { useConnz } from '~/lib/queries';
import Badge from '~/components/Badge';
import Toggle from '~/components/Toggle';
import SlideOver from '~/components/SlideOver';
import Dropdown, { type Options } from '~/components/Dropdown';
import ConnectionItem from '~/components/dashboard/ConnectionItem';
import ConnectionDetails from '~/components/dashboard/ConnectionDetails';
import {
  ChevronUpDownIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  LoadingIcon,
} from '~/components/icons';

function sortOptions(state: ConnState): Options<ConnzSortOpt> {
  return [
    { value: 'cid', label: 'CID' },
    { value: 'rtt', label: 'RTT' },
    { value: 'uptime', label: 'Uptime' },
    { value: 'last', label: 'Last Activity' },
    { value: 'idle', label: 'Idle Time' },
    { value: 'subs', label: 'Subscriptions' },
    { value: 'msgs_from', label: 'Msgs. Sent' },
    { value: 'msgs_to', label: 'Msgs. Received' },
    { value: 'bytes_from', label: 'Data Size Sent' },
    { value: 'bytes_to', label: 'Data Size Received' },
    { value: 'pending', label: 'Pending Data' },
    { value: 'start', label: 'Connection Start' },
    // Only valid for closed connections.
    { value: 'stop', label: 'Connection Stop', disabled: state !== 'closed' },
    { value: 'reason', label: 'Close Reason', disabled: state !== 'closed' },
  ];
}

/** Sorting options valid only for closed connections. */
const closedConnSortOpts: readonly ConnzSortOpt[] = ['stop', 'reason'];

const limitOptions: Options<number> = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
  { value: 250, label: '250' },
  { value: 500, label: '500' },
  { value: 1000, label: '1000' },
];

const stateOptions: Options<ConnState> = [
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'any', label: 'Any' },
];

const subsOptions: Options<SubsOption> = [
  { value: false, label: 'No Subscriptions' },
  { value: true, label: 'Include Subscriptions' },
  { value: 'detail', label: 'Detailed Subscriptions' },
];

export default function ConnectionsList() {
  const [store] = useStore();
  const [settings, actions] = useSettings();
  const [offset, setOffset] = createSignal(0);

  const connz = useConnz(() => ({
    state: settings.connz.state,
    sort: settings.connz.sort,
    limit: settings.connz.limit,
    subs: settings.connz.subs,
    auth: settings.connz.auth,
    offset: offset(),
  }));

  const [selectedID, setSelectedID] = createSignal<number>();
  const selectedConn = createMemo(
    () => connz.data?.connections.find((c) => c.cid === selectedID())
  );

  const prev = () => setOffset((o) => Math.max(0, o - settings.connz.limit));
  const next = () => setOffset((o) => o + settings.connz.limit);

  const isFirstPage = () => offset() === 0;
  const isLastPage = () =>
    offset() + settings.connz.limit >= (connz.data?.total ?? 0);

  const numConnections = () => {
    const total = connz.data?.total ?? 0;
    const current = connz.data?.num_connections ?? 0;

    if (total > 0 && total !== current) {
      return `${current} of ${total}`;
    }

    return total;
  };

  return (
    <section class="tabular-nums slashed-zero">
      <header class="flex items-center justify-between border-b border-gray-200 dark:border-white/5 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <h1 class="text-base font-semibold leading-7 text-gray-900 dark:text-white">
          Connections
          <Badge
            type="pill"
            color={(connz.data?.total ?? 0) > 0 ? 'green' : 'gray'}
            class="ml-3"
          >
            {numConnections()}
          </Badge>
        </h1>

        <div class="flex items-center gap-6">
          <div class="hidden sm:flex items-center gap-2">
            <button
              type="button"
              class="flex flex-none items-center justify-center p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-default"
              onClick={prev}
              disabled={isFirstPage()}
            >
              <ChevronLeftIcon class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="flex flex-none items-center justify-center p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-default"
              onClick={next}
              disabled={isLastPage()}
            >
              <ChevronRightIcon class="h-4 w-4" />
            </button>
          </div>

          <Dropdown
            class="hidden sm:block"
            width="20"
            options={limitOptions}
            active={settings.connz.limit}
            onChange={(limit) => actions.setConnz({ limit })}
          >
            <button
              type="button"
              class="flex items-center gap-x-1 text-sm font-medium leading-6 text-gray-900 dark:text-white"
            >
              Limit
              <ChevronDownIcon class="h-4 w-4 text-gray-500" />
            </button>
          </Dropdown>

          {/* Separator */}
          <div class="hidden xl:block h-6 w-px bg-gray-300 dark:bg-white/10" />

          <Dropdown
            class="hidden xl:block"
            width="20"
            options={stateOptions}
            active={settings.connz.state}
            onChange={(state) => {
              // Reset the sort option if invalid for the new connections state.
              const sort =
                state !== 'closed' &&
                closedConnSortOpts.includes(settings.connz.sort)
                  ? 'cid'
                  : settings.connz.sort;

              actions.setConnz({ state, sort });
            }}
          >
            <button
              type="button"
              class="flex items-center gap-x-1 text-sm font-medium leading-6 text-gray-900 dark:text-white"
            >
              State
              <ChevronDownIcon class="h-4 w-4 text-gray-500" />
            </button>
          </Dropdown>

          {/* Separator */}
          <div class="hidden xl:block h-6 w-px bg-gray-300 dark:bg-white/10" />

          <Dropdown
            class="hidden xl:block"
            options={subsOptions}
            active={settings.connz.subs}
            onChange={(subs) => actions.setConnz({ subs })}
          >
            <button
              type="button"
              class="flex items-center gap-x-1 text-sm font-medium leading-6 text-gray-900 dark:text-white"
            >
              Subs
              <ChevronDownIcon class="h-4 w-4 text-gray-500" />
            </button>
          </Dropdown>

          {/* Separator */}
          <div class="hidden xl:block h-6 w-px bg-gray-300 dark:bg-white/10" />

          <div class="hidden xl:flex items-center">
            <Toggle
              checked={settings.connz.auth}
              onChange={(auth) => actions.setConnz({ auth })}
            />
            <span class="ml-3 text-sm">
              <span class="text-gray-900 dark:text-white">Auth</span>
            </span>
          </div>

          {/* Separator */}
          <div class="h-6 w-px bg-gray-300 dark:bg-white/10" />

          <Dropdown
            options={sortOptions(settings.connz.state)}
            active={settings.connz.sort}
            onChange={(sort) => actions.setConnz({ sort })}
          >
            <button
              type="button"
              class="flex items-center gap-x-1 text-sm font-medium leading-6 text-gray-900 dark:text-white"
            >
              Sort by
              <ChevronUpDownIcon class="h-5 w-5 text-gray-500" />
            </button>
          </Dropdown>
        </div>
      </header>

      <Switch>
        <Match when={!store.active && !connz.isFetched}>
          <p class="px-4 py-4 sm:px-6 lg:px-8 text-gray-900 dark:text-white">
            Start monitoring to display connections.
          </p>
        </Match>

        {/* Note: Cannot check isLoading (New query is created on options change). */}
        <Match when={store.active && !connz.isFetched}>
          <div class="flex items-center justify-center h-40 px-4 py-4 sm:px-6 lg:px-8 text-gray-900 dark:text-white">
            <LoadingIcon class="h-5 w-5" />
          </div>
        </Match>

        <Match when={connz.isSuccess}>
          <ul role="list" class="divide-y divide-gray-200 dark:divide-white/5">
            <For
              each={connz.data?.connections}
              fallback={
                <li class="px-4 py-6 sm:px-6 lg:px-8 text-gray-900 dark:text-white">
                  No connections to display.
                </li>
              }
            >
              {(conn) => (
                <ConnectionItem connection={conn} onClick={setSelectedID} />
              )}
            </For>
          </ul>
        </Match>
      </Switch>

      {/* Slide over connection details. */}
      <Show when={selectedConn()}>
        <SlideOver
          title="Connection Info"
          onClose={() => setSelectedID(undefined)}
          size="lg"
        >
          <ConnectionDetails connection={selectedConn()!} />
        </SlideOver>
      </Show>
    </section>
  );
}
