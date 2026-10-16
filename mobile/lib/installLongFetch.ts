/** Expo fetch defaults to 12s and redboxes. Stretch it and turn timeouts into HTTP 408. */
const FETCH_MS = 45000;

function isTimeout(error: unknown) {
  if (!error) return false;
  const name = error instanceof Error ? error.name : '';
  const message = error instanceof Error ? error.message : String(error);
  return name === 'TimeoutError' || /12000ms timeout exceeded/i.test(message);
}

const globalFetch = globalThis as typeof globalThis & { __finderbLongFetch?: boolean };

if (!globalFetch.__finderbLongFetch && typeof globalThis.fetch === 'function') {
  const original = globalThis.fetch.bind(globalThis);
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const next = { ...(init || {}) } as RequestInit & { timeout?: number };
    if (next.timeout == null) next.timeout = FETCH_MS;
    try {
      return await original(input, next);
    } catch (error) {
      if (!isTimeout(error)) throw error;
      return new Response(JSON.stringify({ success: false, error: 'Request timed out.' }), {
        status: 408,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }) as typeof fetch;
  globalFetch.__finderbLongFetch = true;
}
