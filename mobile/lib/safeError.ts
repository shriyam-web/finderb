const SENSITIVE =
  /https?:\/\/|bearer\s|eyJ[A-Za-z0-9_-]{8,}|supabase|password|secret|token|stack|EXPO_PUBLIC|service_role|api[_-]?key|postgres|relation |column |schema /i;

function readMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return '';
}

/** Short, ordinary failures can be shown. Setup, database, and token text cannot. */
export function safeUserError(error: unknown, fallback: string): string {
  const text = readMessage(error).trim();
  if (!text || text.length > 160 || SENSITIVE.test(text)) return fallback;
  return text;
}
