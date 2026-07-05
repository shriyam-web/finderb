import {
  extractIndianMobileDigits,
  isValidIndianMobileDigits,
} from '@/lib/indianPhone';
import { TRUECALLER_PHONE_EMAIL_DOMAIN } from '@/lib/auth/truecallerConfig';

export type TruecallerProfile = {
  phoneNumbers?: string[];
  avatarUrl?: string;
  onlineIdentities?: {
    email?: string;
    url?: string;
    facebookId?: string;
  };
  name?: {
    first?: string;
    last?: string;
  };
  userId?: string;
  id?: string;
};

export type ParsedTruecallerIdentity = {
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  truecallerUserId: string | null;
  hasRealEmail: boolean;
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function asString(value: unknown): string {
  if (value == null) return '';
  return typeof value === 'string' ? value.trim() : String(value).trim();
}

export function parseTruecallerProfile(profile: TruecallerProfile): ParsedTruecallerIdentity | null {
  const rawRecord = profile as TruecallerProfile & {
    phoneNumber?: unknown;
    phone?: unknown;
    phoneNumbers?: unknown[];
  };

  const rawPhone =
    rawRecord.phoneNumbers?.[0] != null
      ? asString(rawRecord.phoneNumbers[0])
      : rawRecord.phoneNumber != null
        ? asString(rawRecord.phoneNumber)
        : rawRecord.phone != null
          ? asString(rawRecord.phone)
          : '';

  const phone = extractIndianMobileDigits(rawPhone);
  if (!isValidIndianMobileDigits(phone)) {
    return null;
  }

  const tcEmail = asString(profile.onlineIdentities?.email).toLowerCase();
  const hasRealEmail = Boolean(tcEmail && isValidEmail(tcEmail));
  const email = hasRealEmail ? tcEmail : `${phone}@${TRUECALLER_PHONE_EMAIL_DOMAIN}`;

  const first = asString(profile.name?.first);
  const last = asString(profile.name?.last);
  const combined = `${first} ${last}`.trim();
  const fullName = combined.length >= 2 ? combined : 'FinderB User';

  const avatarUrlRaw = asString(profile.avatarUrl);
  const avatarUrl =
    avatarUrlRaw.startsWith('http') ? avatarUrlRaw : null;

  const truecallerUserIdRaw = asString(profile.userId) || asString(profile.id);
  const truecallerUserId = truecallerUserIdRaw || null;

  return {
    fullName,
    email,
    phone,
    avatarUrl,
    truecallerUserId,
    hasRealEmail,
  };
}

export async function fetchTruecallerProfile(
  accessToken: string,
  endpoint: string
): Promise<TruecallerProfile> {
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Cache-Control': 'no-cache',
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      `Truecaller profile fetch failed (${response.status})${detail ? `: ${detail.slice(0, 120)}` : ''}`
    );
  }

  return (await response.json()) as TruecallerProfile;
}
