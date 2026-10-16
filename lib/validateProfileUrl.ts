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

/** Ensure user-entered links open externally (e.g. instagram.com → https://instagram.com). */
export function normalizeExternalHref(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed.replace(/^\/+/, '')}`;
}

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
  const trimmed = raw.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
  if (!trimmed) return { ok: true, value: '' };

  const meta = LINK_FIELD_META[field];
  if (!meta) return { ok: true, value: trimmed };

  const candidate = normalizeExternalHref(trimmed);
  if (!candidate) return { ok: true, value: '' };

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
    const name = meta.label.toLowerCase();
    return {
      ok: false,
      error:
        field === 'website'
          ? 'Enter a complete website address, like https://yourshop.com'
          : `Enter a complete ${name} link`,
    };
  }

  if (meta.hosts && !hostMatchesAllowed(parsed.hostname, meta.hosts)) {
    return { ok: false, error: `Enter a valid ${meta.label} profile link` };
  }

  const value = parsed.toString().replace(/\/$/, '');
  return { ok: true, value };
}
