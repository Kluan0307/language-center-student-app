export type QuerySnapshot<T = unknown> = {
  data?: T; error?: string; fetching: boolean; updatedAt: number; revision: number;
};
export type QueryActivity = { staleCount: number; updatedAt: number; fetching: number };
type Entry = { snapshot: QuerySnapshot; path: string; touched: number; retained: number; generation: number; invalidated: boolean; controller?: AbortController; task?: Promise<void> };
type Failure = { kind?: string; status?: number; message?: string };
const EMPTY: QuerySnapshot = Object.freeze({ fetching: false, updatedAt: 0, revision: 0 });

export function canKeepLastData(error: unknown) {
  const failure = error as Failure | undefined;
  return failure?.kind === 'network' || failure?.kind === 'timeout' || failure?.kind === 'http' && Number(failure.status) >= 500;
}
export function freshnessMs(path: string) {
  // Financial decisions, publications and editable versions always revalidate.
  return path.startsWith('/finance/') || /\/(grades|final-result|attendance|notification-preferences|support-requests)(\/|\?|$)/.test(path) ? 0 : 15000;
}
export function createQueryClient(options: { now?: () => number; maxEntries?: number; retentionMs?: number } = {}) {
  const now = options.now ?? Date.now, maxEntries = options.maxEntries ?? 40, retentionMs = options.retentionMs ?? 300000;
  const entries = new Map<string, Entry>(), listeners = new Map<string, Set<() => void>>(), observers = new Set<() => void>();
  let activity: QueryActivity = { staleCount: 0, updatedAt: 0, fetching: 0 };
  const metrics = { requests: 0, cacheHits: 0, deduplicated: 0, evicted: 0, durationsMs: [] as number[] };
  function notify(key: string) {
    const active = [...entries.values()].filter(entry => entry.retained > 0);
    const stale = active.filter(entry => entry.snapshot.data !== undefined && entry.snapshot.error);
    activity = { staleCount: stale.length, updatedAt: stale.length ? Math.min(...stale.map(entry => entry.snapshot.updatedAt)) : 0, fetching: active.filter(entry => entry.snapshot.fetching).length };
    listeners.get(key)?.forEach(listener => listener()); observers.forEach(listener => listener());
  }
  function ensure(key: string) {
    let entry = entries.get(key);
    if (!entry) { entry = { snapshot: EMPTY, path: '', touched: now(), retained: 0, generation: 0, invalidated: false }; entries.set(key, entry); }
    return entry;
  }
  function prune() {
    const unused = [...entries.entries()].filter(([, entry]) => !entry.retained && !entry.task).sort((a, b) => a[1].touched - b[1].touched);
    for (const [key, entry] of unused) {
      if (entries.size <= maxEntries && now() - entry.touched < retentionMs) continue;
      entries.delete(key); metrics.evicted++; notify(key);
    }
  }
  function cancel(entry: Entry) {
    entry.generation++; entry.controller?.abort(); entry.controller = undefined; entry.task = undefined;
    entry.snapshot = { ...entry.snapshot, fetching: false };
  }
  function invalidateKey(key: string) {
    const entry = ensure(key); cancel(entry); entry.invalidated = true;
    entry.snapshot = { ...entry.snapshot, revision: entry.snapshot.revision + 1 }; notify(key);
  }
  function retain(key: string) {
    const entry = ensure(key); entry.retained++; entry.touched = now(); notify(key);
    return () => {
      entry.retained = Math.max(0, entry.retained - 1); entry.touched = now();
      if (!entry.retained && entry.task) cancel(entry);
      notify(key); prune();
    };
  }
  function fetch<T>(key: string, path: string, loader: (signal: AbortSignal) => Promise<T>): Promise<void> {
    const entry = ensure(key); entry.path = path; entry.touched = now();
    if (entry.task) { metrics.deduplicated++; return entry.task; }
    if (!entry.invalidated && entry.snapshot.data !== undefined && !entry.snapshot.error && now() - entry.snapshot.updatedAt < freshnessMs(path)) {
      metrics.cacheHits++; return Promise.resolve();
    }
    const generation = ++entry.generation, controller = new AbortController(), started = now();
    entry.controller = controller; entry.snapshot = { ...entry.snapshot, fetching: true }; metrics.requests++;
    const current = () => entries.get(key) === entry && generation === entry.generation && !controller.signal.aborted;
    // Deferring the loader one microtask lets simultaneous consumers share this task.
    const task = Promise.resolve().then(() => {
      if (!current()) throw { kind: 'cancelled' };
      return loader(controller.signal);
    }).then(data => {
      if (!current()) return;
      entry.invalidated = false;
      entry.snapshot = { data, fetching: false, updatedAt: now(), revision: entry.snapshot.revision };
    }).catch(error => {
      if (!current()) return;
      const keep = canKeepLastData(error);
      entry.snapshot = { data: keep ? entry.snapshot.data : undefined, error: (error as Failure)?.message || 'Chưa tải được dữ liệu. Vui lòng thử lại.', fetching: false,
        updatedAt: keep ? entry.snapshot.updatedAt : 0, revision: entry.snapshot.revision };
    }).finally(() => {
      if (!current()) return;
      entry.task = undefined; entry.controller = undefined; entry.touched = now();
      entry.snapshot = { ...entry.snapshot, fetching: false };
      metrics.durationsMs.push(Math.max(0, now() - started)); if (metrics.durationsMs.length > 100) metrics.durationsMs.shift();
      notify(key); prune();
    });
    entry.task = task; notify(key); prune(); return task;
  }
  return {
    fetch, retain, invalidateKey,
    getSnapshot: <T>(key: string) => (entries.get(key)?.snapshot ?? EMPTY) as QuerySnapshot<T>,
    subscribe(key: string, listener: () => void) {
      let group = listeners.get(key); if (!group) { group = new Set(); listeners.set(key, group); } group.add(listener);
      return () => { group!.delete(listener); if (!group!.size) listeners.delete(key); };
    },
    subscribeActivity(listener: () => void) { observers.add(listener); return () => { observers.delete(listener); }; },
    getActivity: () => activity,
    invalidate(prefix = '') { for (const [key, entry] of entries) if (entry.path.startsWith(prefix)) invalidateKey(key); },
    retryActive() { for (const [key, entry] of entries) if (entry.retained) invalidateKey(key); },
    clear() { const keys = [...entries.keys()]; for (const entry of entries.values()) cancel(entry); entries.clear(); keys.forEach(notify); },
    stats: () => ({ ...metrics, durationsMs: [...metrics.durationsMs], entries: entries.size }),
  };
}
export type QueryClient = ReturnType<typeof createQueryClient>;
