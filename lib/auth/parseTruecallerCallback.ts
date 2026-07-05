export type TruecallerCallbackPayload = {
  requestId: string;
  accessToken?: string;
  endpoint?: string;
  status?: string;
};

export async function parseTruecallerCallbackBody(
  request: Request
): Promise<TruecallerCallbackPayload | null> {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';

  try {
    if (contentType.includes('application/json')) {
      return normalizeCallbackPayload((await request.json()) as Record<string, unknown>);
    }

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text();
      const params = new URLSearchParams(text);
      return normalizeCallbackPayload(Object.fromEntries(params.entries()));
    }

    const text = await request.text();
    if (!text.trim()) return null;

    try {
      return normalizeCallbackPayload(JSON.parse(text) as Record<string, unknown>);
    } catch {
      const params = new URLSearchParams(text);
      if ([...params.keys()].length > 0) {
        return normalizeCallbackPayload(Object.fromEntries(params.entries()));
      }
    }
  } catch {
    return null;
  }

  return null;
}

function normalizeCallbackPayload(
  raw: Record<string, unknown>
): TruecallerCallbackPayload | null {
  const requestId = String(
    raw.requestId ?? raw.requestNonce ?? raw.request_id ?? raw.requestID ?? ''
  ).trim();

  if (!requestId) return null;

  const accessToken = String(raw.accessToken ?? raw.access_token ?? '').trim() || undefined;
  const endpoint = String(raw.endpoint ?? '').trim() || undefined;
  const status = String(raw.status ?? '').trim() || undefined;

  return { requestId, accessToken, endpoint, status };
}
