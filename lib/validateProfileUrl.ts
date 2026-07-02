const LINK_FIELD_META: Record<string, { label: string; hosts?: string[] }> = {
  website: { label: 'Website' },
  instagramUrl: {
    label: 'Instagram',
    hosts: ['instagram.com'],
  },
  facebookUrl: {
    label: 'Facebook',
    hosts: ['facebook.com', 'fb.com'],
  },
  youtubeUrl: {
    label: 'YouTube',
    hosts: ['youtube.com', 'youtu.be'],
  },
};

export const PROFILE_LINK_FIELDS = new Set(Object.keys(LINK_FIELD_META));

function normalizeHostname(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, '');
}

function hostMatchesAllowed(hostname: string, allowedHosts: string[]) {
  const host = normalizeHostname(hostname);
  return allowedHosts.some((allowed) => {
    const normalized = normalizeHostname(allowed);
    return host === normalized || host.endsWith(`.${normalized}`);
  });
}

export function validateProfileLink(
  field: string,
  raw: string,
): { ok: true; value: string } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: '' };

  const meta = LINK_FIELD_META[field];
  if (!meta) return { ok: true, value: trimmed };

  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { ok: false, error: 'Enter a valid URL (e.g. https://example.com)' };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { ok: false, error: 'URL must use http:// or https://' };
  }

  if (!parsed.hostname || !parsed.hostname.includes('.')) {
    return { ok: false, error: 'Enter a complete website address' };
  }

  if (meta.hosts && !hostMatchesAllowed(parsed.hostname, meta.hosts)) {
    return { ok: false, error: `Enter a valid ${meta.label} profile link` };
  }

  const value = parsed.toString().replace(/\/$/, '');
  return { ok: true, value };
}
