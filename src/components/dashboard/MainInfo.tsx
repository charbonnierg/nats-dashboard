import { useStore } from '~/lib/store';
import { useVarz } from '~/lib/queries';
import Indicator from '~/components/Indicator';

export default function MainInfo() {
  const [store] = useStore();
  const varz = useVarz();

  return (
    <div class="flex flex-col items-start justify-between gap-x-8 gap-y-4 bg-gray-50 dark:bg-gray-700/10 px-4 py-4 sm:flex-row sm:items-center sm:px-6 lg:px-8 tabular-nums">
      <div>
        <div class="flex items-center gap-x-3">
          <Indicator color={store.active ? 'green' : 'gray'} />

          <h1 class="flex gap-x-3 text-base leading-7">
            <span class="font-semibold text-gray-900 dark:text-white">
              {varz.data?.serverName}
            </span>
            <span class="text-gray-600">/</span>
            <span class="font-semibold text-gray-900 dark:text-white">
              {varz.data?.uptime}
            </span>
          </h1>
        </div>
        <p class="mt-2 text-xs leading-6 text-gray-500 dark:text-gray-400">
          <span class="font-semibold text-gray-900 dark:text-white">
            Server ID
          </span>
          :<span class="break-all ml-1">{varz.data?.serverID}</span>
        </p>
      </div>

      <div class="order-first flex-none rounded-full bg-cyan-50 text-cyan-700 ring-cyan-700/10 dark:bg-cyan-400/10 px-2 py-1 text-xs font-medium dark:text-cyan-400 ring-1 ring-inset dark:ring-cyan-400/30 sm:order-none">
        v{varz.data?.version}
      </div>
    </div>
  );
}