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

export function parseTruecallerProfile(profile: TruecallerProfile): ParsedTruecallerIdentity | null {
  const rawRecord = profile as TruecallerProfile & {
    phoneNumber?: string | number;
    phone?: string | number;
  };

  const rawPhone =
    profile.phoneNumbers?.[0] ??
    (rawRecord.phoneNumber != null
      ? String(rawRecord.phoneNumber)
      : rawRecord.phone != null
        ? String(rawRecord.phone)
        : '');

  const phone = extractIndianMobileDigits(rawPhone);
  if (!isValidIndianMobileDigits(phone)) {
    return null;
  }

  const tcEmail = profile.onlineIdentities?.email?.toLowerCase().trim() ?? '';
  const hasRealEmail = Boolean(tcEmail && isValidEmail(tcEmail));
  const email = hasRealEmail ? tcEmail : `${phone}@${TRUECALLER_PHONE_EMAIL_DOMAIN}`;

  const first = profile.name?.first?.trim() ?? '';
  const last = profile.name?.last?.trim() ?? '';
  const combined = `${first} ${last}`.trim();
  const fullName = combined.length >= 2 ? combined : 'FinderB User';

  const avatarUrl =
    typeof profile.avatarUrl === 'string' && profile.avatarUrl.startsWith('http')
      ? profile.avatarUrl
      : null;

  const truecallerUserId =
    typeof profile.userId === 'string' && profile.userId.trim()
      ? profile.userId.trim()
      : typeof profile.id === 'string' && profile.id.trim()
        ? profile.id.trim()
        : null;

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
