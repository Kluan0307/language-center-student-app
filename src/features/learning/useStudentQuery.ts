import { useCallback, useSyncExternalStore } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSession } from '../../providers/SessionProvider';
import { useStudentQueries } from '../../providers/StudentQueryProvider';
import { loadAllPages } from './utils';

export function useStudentQuery<T>(path: string | null, allPages = false) {
  const { api, status, identity } = useSession(), client = useStudentQueries();
  const enabled = status === 'authenticated' && !identity?.mustChangePassword && path !== null;
  const key = JSON.stringify([path, allPages]);
  const subscribe = useCallback((listener: () => void) => client.subscribe(key, listener), [client, key]);
  const getSnapshot = useCallback(() => client.getSnapshot<T>(key), [client, key]);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useFocusEffect(useCallback(() => {
    if (!enabled || !path) return;
    const release = client.retain(key);
    void client.fetch<T>(key, path, signal => allPages ? loadAllPages(api, path, signal) as Promise<T> : api<T>(path, { signal }));
    return release;
  }, [api, client, enabled, key, path, allPages, snapshot.revision]));
  const reload = useCallback(() => { if (enabled) client.invalidateKey(key); }, [client, key, enabled]);
  const current = enabled ? snapshot : undefined, hasData = current?.data !== undefined;
  return {
    data: current?.data, error: hasData ? undefined : current?.error,
    refreshError: hasData ? current?.error : undefined,
    fetching: enabled && snapshot.fetching, refreshing: enabled && snapshot.fetching,
    loading: enabled && !hasData && !current?.error, updatedAt: current?.updatedAt ?? 0,
    enabled, reload,
  };
}
