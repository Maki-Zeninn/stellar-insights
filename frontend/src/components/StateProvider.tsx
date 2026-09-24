"use client";

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ReactQueryProvider } from '@/lib/react-query/provider';
import { useAppStore } from '@/lib/zustand/store';

interface StateProviderProps {
  children: React.ReactNode;
}

/**
 * Root state provider: React Query for server state, Zustand for client state.
 * React Query devtools and the query logger are mounted by `ReactQueryProvider`
 * in development; this adds `window.__stateDevtools` for console debugging.
 *
 * See docs/FRONTEND_STATE_MANAGEMENT.md.
 */
export function StateProvider({ children }: StateProviderProps) {
  return (
    <ReactQueryProvider>
      {children}
      {process.env.NODE_ENV === 'development' && <StateDevTools />}
    </ReactQueryProvider>
  );
}

/**
 * Development-only console helpers. Reads the store imperatively so it never
 * subscribes to (and re-renders on) state changes.
 */
function StateDevTools() {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const w = window as unknown as { __stateDevtools?: unknown };
    w.__stateDevtools = {
      // Client state (Zustand)
      getState: () => useAppStore.getState(),
      logState: () => console.log('Store State:', useAppStore.getState()),
      resetState: () => useAppStore.getState().resetState(),

      // Server state (React Query)
      logQueries: () => console.log('Query Cache:', queryClient.getQueryCache().getAll()),
      invalidateAll: () => queryClient.invalidateQueries(),
      getQueryData: (queryKey: readonly unknown[]) => queryClient.getQueryData(queryKey),
      getPerformance: () => {
        const queries = queryClient.getQueryCache().getAll();
        return {
          totalQueries: queries.length,
          activeQueries: queries.filter((q) => q.getObserversCount() > 0).length,
          staleQueries: queries.filter((q) => q.isStale()).length,
          fetchingQueries: queries.filter((q) => q.state.fetchStatus === 'fetching').length,
        };
      },
    };

    return () => {
      delete w.__stateDevtools;
    };
  }, [queryClient]);

  return null;
}

export { StateDevTools };
