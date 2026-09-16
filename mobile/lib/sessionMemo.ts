/** In-memory memo for one app process. Cleared only on pull-to-refresh or process death. */

export function createSessionMemo<T>() {
  const cache = new Map<string, T>();
  const inflight = new Map<string, Promise<T>>();

  return {
    peek(key: string): T | undefined {
      return cache.get(key);
    },
    has(key: string): boolean {
      return cache.has(key);
    },
    set(key: string, value: T) {
      cache.set(key, value);
    },
    delete(key: string) {
      cache.delete(key);
      inflight.delete(key);
    },
    clear() {
      cache.clear();
      inflight.clear();
    },
    async get(
      key: string,
      loader: () => Promise<T>,
      force = false,
    ): Promise<T> {
      if (!force) {
        const hit = cache.get(key);
        if (hit !== undefined) return hit;
        const pending = inflight.get(key);
        if (pending) return pending;
      }

      const pending = loader();
      inflight.set(key, pending);
      try {
        const value = await pending;
        cache.set(key, value);
        return value;
      } finally {
        inflight.delete(key);
      }
    },
  };
}
