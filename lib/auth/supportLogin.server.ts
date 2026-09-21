import 'server-only';

import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { createServiceClient } from '@/lib/supabase/service';
import {
  SUPPORT_SESSION_COOKIE_MAX_AGE,
  setBusinessSessionCookie,
} from '@/lib/security/session';

const REDEEM_TTL_MS = 2 * 60 * 1000;

function supportSecret(): string {
  const secret =
    process.env.FINDERB_SUPPORT_LOGIN_SECRET?.trim() ||
    process.env.FINDERB_DISPATCH_SECRET?.trim() ||
    process.env.MOBILE_SESSION_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!secret) {
    throw new Error('Missing secret for support login tokens');
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac('sha256', supportSecret()).update(payload).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export type MintSupportLoginInput = {
  businessId: string;
  adminId: string;
  adminEmail?: string | null;
  reason?: string | null;
};

export type MintSupportLoginResult =
  | {
      success: true;
      token: string;
      redeemUrl: string;
      expiresAt: string;
      business: {
        id: string;
        businessName: string;
        displayName: string;
        registrationNumber: string | null;
        slug: string | null;
      };
    }
  | { success: false; error: string };

export async function mintSupportLoginToken(
  input: MintSupportLoginInput,
): Promise<MintSupportLoginResult> {
  const businessId = String(input.businessId || '').trim();
  const adminId = String(input.adminId || '').trim();
  if (!businessId || !adminId) {
    return { success: false, error: 'businessId and adminId are required' };
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return { success: false, error: 'Service client unavailable' };
  }

  const { data: business, error } = await supabase
    .from('Business')
    .select('id, businessName, displayName, registrationNumber, slug')
    .eq('id', businessId)
    .maybeSingle();

  if (error || !business) {
    return { success: false, error: 'Business not found' };
  }

  const jti = randomUUID();
  const exp = Date.now() + REDEEM_TTL_MS;
  const payload = `support-login:${businessId}:${adminId}:${jti}:${exp}`;
  const token = Buffer.from(`${payload}.${sign(payload)}`).toString('base64url');

  const { error: insertError } = await supabase.from('support_login_tokens').insert({
    jti,
    business_id: businessId,
    admin_id: adminId,
    admin_email: input.adminEmail ? String(input.adminEmail) : null,
    reason: input.reason ? String(input.reason).slice(0, 500) : null,
    expires_at: new Date(exp).toISOString(),
  });

  if (insertError) {
    // Table may not exist yet — still allow signed short-lived token.
    console.warn('[support-login] token table insert failed', insertError.message);
  }

  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://finderb.com';

  return {
    success: true,
    token,
    redeemUrl: `${site}/business/support-login?token=${encodeURIComponent(token)}`,
    expiresAt: new Date(exp).toISOString(),
    business: {
      id: String(business.id),
      businessName: String(business.businessName || ''),
      displayName: String(business.displayName || business.businessName || ''),
      registrationNumber: business.registrationNumber
        ? String(business.registrationNumber)
        : null,
      slug: business.slug ? String(business.slug) : null,
    },
  };
}

export type RedeemSupportLoginResult =
  | { success: true; businessId: string }
  | { success: false; error: string };

export async function redeemSupportLoginToken(
  rawToken: string,
): Promise<RedeemSupportLoginResult> {
  const token = String(rawToken || '').trim();
  if (!token) return { success: false, error: 'Missing support login token' };

  let payload = '';
  let sig = '';
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const idx = decoded.lastIndexOf('.');
    if (idx <= 0) return { success: false, error: 'Invalid support login token' };
    payload = decoded.slice(0, idx);
    sig = decoded.slice(idx + 1);
  } catch {
    return { success: false, error: 'Invalid support login token' };
  }

  if (!safeEqual(sig, sign(payload))) {
    return { success: false, error: 'Invalid support login token' };
  }

  const parts = payload.split(':');
  if (parts.length !== 5 || parts[0] !== 'support-login') {
    return { success: false, error: 'Invalid support login token' };
  }

  const [, businessId, adminId, jti, expRaw] = parts;
  const exp = Number(expRaw);
  if (!businessId || !adminId || !jti || !Number.isFinite(exp) || Date.now() > exp) {
    return { success: false, error: 'Support login token expired. Generate a new one.' };
  }

  const supabase = createServiceClient();
  if (supabase) {
    const { data: row } = await supabase
      .from('support_login_tokens')
      .select('jti, consumed_at, expires_at, business_id')
      .eq('jti', jti)
      .maybeSingle();

    if (row) {
      if (row.consumed_at) {
        return { success: false, error: 'Support login token already used.' };
      }
      if (String(row.business_id) !== businessId) {
        return { success: false, error: 'Support login token mismatch.' };
      }
      const { error: consumeError } = await supabase
        .from('support_login_tokens')
        .update({ consumed_at: new Date().toISOString() })
        .eq('jti', jti)
        .is('consumed_at', null);
      if (consumeError) {
        console.warn('[support-login] consume failed', consumeError.message);
      }
    }
  }

  await setBusinessSessionCookie(businessId, {
    maxAge: SUPPORT_SESSION_COOKIE_MAX_AGE,
    supportSession: true,
  });

  return { success: true, businessId };
}

export async function searchBusinessesForSupportLogin(query: string) {
  const q = String(query || '').trim();
  if (q.length < 2) {
    return { success: false as const, error: 'Enter at least 2 characters.', businesses: [] };
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return { success: false as const, error: 'Service client unavailable', businesses: [] };
  }

  const like = q.replace(/[%_]/g, '');
  const orFilter = [
    `businessName.ilike.%${like}%`,
    `displayName.ilike.%${like}%`,
    `registrationNumber.ilike.%${like}%`,
    `email.ilike.%${like}%`,
    `slug.ilike.%${like}%`,
  ];

  // Exact id match when UUID-shaped
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      q,
    );

  let queryBuilder = supabase
    .from('Business')
    .select(
      'id, businessName, displayName, registrationNumber, slug, city, status, email, mobile',
    )
    .order('updatedAt', { ascending: false })
    .limit(20);

  if (isUuid) {
    queryBuilder = queryBuilder.or(`id.eq.${q},${orFilter.join(',')}`);
  } else {
    queryBuilder = queryBuilder.or(orFilter.join(','));
  }

  const { data, error } = await queryBuilder;
  if (error) {
    return { success: false as const, error: error.message, businesses: [] };
  }

  return {
    success: true as const,
    businesses: (data || []).map((row) => ({
      id: String(row.id),
      businessName: String(row.businessName || ''),
      displayName: String(row.displayName || row.businessName || ''),
      registrationNumber: row.registrationNumber
        ? String(row.registrationNumber)
        : null,
      slug: row.slug ? String(row.slug) : null,
      city: row.city ? String(row.city) : null,
      status: row.status ? String(row.status) : null,
      email: row.email ? String(row.email) : null,
      mobile: row.mobile ? String(row.mobile) : null,
    })),
  };
}
