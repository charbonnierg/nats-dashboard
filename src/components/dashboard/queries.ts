import { createMemo } from "solid-js";
import { createQuery, useQueryClient } from "@tanstack/solid-query";

import type { ConnzOptions, JszOptions } from "~/types";
import { discoverServers, fetchInfo } from "~/lib/info";
import { getPrevQueryResponse, newestQueryData } from "~/lib/query-utils";
import {
  formatVarz,
  formatConnz,
  formatJsz,
  type APIResponses,
  type FormattedVarz,
  type FormattedConnz,
  type FormattedJsz,
} from "~/lib/format";
import { useStore } from "~/components/context/store";
import { useSettings } from "~/components/context/settings";

/** Start polling for general server information. */
export function useVarz() {
  const [store] = useStore();
  const [settings] = useSettings();
  const queryClient = useQueryClient();

  return createQuery<APIResponses<"varz">, Error, FormattedVarz>(() => ({
    queryKey: [store.url, store.serverId, "varz"],
    queryFn: async ({ queryKey, signal }) => {
      const current = await fetchInfo({
        url: store.url,
        nc: store.connection,
        serverID: store.serverId,
        endpoint: "varz",
        jsonp: settings.jsonp,
        signal,
      });

      const previous = getPrevQueryResponse<"varz">({
        client: queryClient,
        queryKey,
        exact: false,
      });

      return { current, previous };
    },
    select: formatVarz, // Fromat the data for display.
    enabled: store.active,
    refetchInterval: settings.interval,
    reconcile: false,
    meta: {
      errorTitle: "Server Information",
      errorMessage: "Cannot fetch the server information.",
    },
  }));
}

export type VarzQuery = ReturnType<typeof useVarz>;

/** Start polling for connections information. */
export function useConnz(options?: () => ConnzOptions) {
  const [store] = useStore();
  const [settings] = useSettings();
  const queryClient = useQueryClient();

  const optsMemo = createMemo(() => options?.());

  return createQuery<APIResponses<"connz">, Error, FormattedConnz>(() => ({
    queryKey: [store.url, store.serverId, "connz", optsMemo()],
    queryFn: async ({ signal }) => {
      const current = await fetchInfo({
        url: store.url,
        nc: store.connection,
        serverID: store.serverId,
        endpoint: "connz",
        args: optsMemo(),
        jsonp: settings.jsonp,
        signal,
      });

      const previous = getPrevQueryResponse<"connz">({
        client: queryClient,
        // Use a partial query key to retrieve any previous data, regardless of the options.
        queryKey: [store.url, store.serverId, "connz"],
        exact: false,
      });

      return { current, previous };
    },
    select: formatConnz, // Fromat the data for display.
    enabled: store.active,
    refetchInterval: settings.interval,
    reconcile: false,
    meta: {
      errorTitle: "Connections",
      errorMessage: "Cannot fetch the connections information.",
    },
    // Set the initial data from a previous query to keep the same state
    // when changing the fetch settings.
    initialData: () => {
      const data = queryClient.getQueriesData<APIResponses<"connz">>({
        queryKey: [store.url, store.serverId, "connz"],
        exact: false,
      });

      // Return the last query's data or undefined for no initial data.
      return newestQueryData(data) as APIResponses<"connz">;
    },
  }));
}

export type ConnzQuery = ReturnType<typeof useConnz>;

/** Start polling for JetSteam information. */
export function useJsz(options?: () => JszOptions) {
  const [store] = useStore();
  const [settings] = useSettings();
  const queryClient = useQueryClient();

  const optsMemo = createMemo(() => options?.());

  return createQuery<APIResponses<"jsz">, Error, FormattedJsz>(() => ({
    queryKey: [store.url, store.serverId, "jsz", optsMemo()],
    queryFn: async ({ signal }) => {
      const current = await fetchInfo({
        url: store.url,
        nc: store.connection,
        serverID: store.serverId,
        endpoint: "jsz",
        args: optsMemo(),
        jsonp: settings.jsonp,
        signal,
      });

      // We don't need the previous data (No calculations are made).
      return { current };
    },
    select: formatJsz, // Fromat the data for display.
    enabled: store.active,
    refetchInterval: settings.interval,
    reconcile: false,
    meta: {
      errorTitle: "JetStream",
      errorMessage: "Cannot fetch the JetStream server information.",
    },
    // Set the initial data from a previous query to keep the same state
    // when changing the fetch settings.
    initialData: () => {
      // Returns found queries as arrays of [queryKey, data].
      const data = queryClient.getQueriesData<APIResponses<"jsz">>({
        queryKey: [store.url, store.serverId, "jsz"],
        exact: false, // We want a partial queryKey match.
      });

      // Return the last query's data or undefined for no initial data.
      return newestQueryData(data) as APIResponses<"jsz">;
    },
  }));
}

export type JszQuery = ReturnType<typeof useJsz>;

/** Start polling for general server information. */
export function usePingz() {
  const [store] = useStore();
  const [settings] = useSettings();

  return createQuery(() => ({
    queryKey: [store.url, "pingz"],
    queryFn: async () => {
      if (!store.connection) {
        throw new Error("No NATS connection");
      }
      return await discoverServers(store.connection);
    },
    enabled: store.active,
    refetchInterval: settings.interval,
    reconcile: false,
    meta: {
      errorTitle: "Server IDs",
      errorMessage: "Cannot fetch the server IDs.",
    },
  }));
}
export type PingQuery = ReturnType<typeof usePingz>;
