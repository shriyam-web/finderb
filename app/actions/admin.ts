'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import { hashPassword, validatePasswordLength, verifyPassword } from '@/lib/security/password';
import {
  assertAdminSession,
  getSessionAdminId,
  setAdminSessionCookie,
} from '@/lib/security/session';
import { formatAmountInr, getPlanDisplayName } from '@/lib/subscription/merchantSubscription';

const PAYMENTS_PAGE_SIZE = 25;

export type AdminPaymentRecord = {
  id: string;
  businessId: string;
  businessName: string;
  merchantEmail: string;
  merchantMobile: string;
  registrationNumber: string | null;
  plan: string;
  planName: string;
  billingCycle: string;
  amountPaise: number;
  amountDisplay: string;
  status: string;
  orderId: string | null;
  paymentId: string | null;
  subscriptionId: string | null;
  paymentType: string;
  source: string | null;
  planStartedAt: string | null;
  planExpiresAt: string | null;
  createdAt: string;
};

export type AdminPaymentsFilters = {
  page?: number;
  pageSize?: number;
  status?: string;
  billingCycle?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
};

export async function loginAdmin(email: string, password: string) {
  try {
    if (!email || !password) {
      return { success: false as const, error: 'Email and password are required' };
    }

    const passwordCheck = validatePasswordLength(password, 1);
    if (!passwordCheck.ok) {
      return { success: false as const, error: passwordCheck.error };
    }

    const normalizedEmail = email.toLowerCase().trim();

    const ipLimit = await enforceRateLimit('auth');
    if (!ipLimit.ok) return { success: false as const, error: ipLimit.error };

    const emailLimit = await enforceRateLimit('authEmail', `admin-login:${normalizedEmail}`);
    if (!emailLimit.ok) return { success: false as const, error: emailLimit.error };

    const supabase = createClient(await cookies());
    const { data: admin, error } = await supabase
      .from('admins')
      .select('id, password, is_disabled')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error || !admin) {
      return { success: false as const, error: 'No admin account found with this email.' };
    }

    if (admin.is_disabled) {
      return { success: false as const, error: 'This admin account has been disabled.' };
    }

    const verification = await verifyPassword(password, admin.password);
    if (!verification.valid) {
      return { success: false as const, error: 'Incorrect password.' };
    }

    if (verification.needsRehash) {
      const hashedPassword = await hashPassword(password);
      await supabase.from('admins').update({ password: hashedPassword }).eq('id', admin.id);
    }

    await setAdminSessionCookie(admin.id);
    return { success: true as const, adminId: admin.id };
  } catch (error) {
    console.error('[admin] login failed:', error);
    return { success: false as const, error: 'Login failed. Please try again.' };
  }
}

export async function logoutAdmin() {
  try {
    (await cookies()).delete('admin_id');
    revalidatePath('/admin');
    return { success: true as const };
  } catch {
    return { success: false as const, error: 'Failed to sign out' };
  }
}

export async function getAdminSession() {
  const adminId = await getSessionAdminId();
  if (!adminId) return null;

  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from('admins')
    .select('id, email, role, allowed_tabs')
    .eq('id', adminId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function getAdminPayments(filters: AdminPaymentsFilters = {}) {
  const auth = await assertAdminSession();
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return { success: false as const, error: 'Admin service is not configured' };
  }

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? PAYMENTS_PAGE_SIZE));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('merchant_payments')
    .select(
      `
      id,
      business_id,
      plan,
      billing_cycle,
      amount_paise,
      status,
      order_id,
      payment_id,
      razorpay_subscription_id,
      payment_type,
      source,
      plan_started_at,
      plan_expires_at,
      created_at,
      Business:business_id (
        businessName,
        workEmail,
        email,
        mobile,
        registrationNumber
      )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.billingCycle && filters.billingCycle !== 'all') {
    query = query.eq('billing_cycle', filters.billingCycle);
  }

  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }

  if (filters.dateTo) {
    const end = new Date(filters.dateTo);
    end.setHours(23, 59, 59, 999);
    query = query.lte('created_at', end.toISOString());
  }

  const search = filters.search?.trim();
  if (search) {
    const { data: matchingBusinesses } = await supabase
      .from('Business')
      .select('id')
      .or(
        `businessName.ilike.%${search}%,workEmail.ilike.%${search}%,email.ilike.%${search}%,registrationNumber.ilike.%${search}%`
      )
      .limit(50);

    const businessIds = (matchingBusinesses ?? []).map((row) => row.id);
    const orParts = [
      `order_id.ilike.%${search}%`,
      `payment_id.ilike.%${search}%`,
    ];
    if (businessIds.length) {
      orParts.push(`business_id.in.(${businessIds.join(',')})`);
    }
    query = query.or(orParts.join(','));
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[admin] payments fetch failed:', error);
    return { success: false as const, error: 'Could not load payments' };
  }

  const payments: AdminPaymentRecord[] = (data ?? []).map((row) => {
    const business = Array.isArray(row.Business) ? row.Business[0] : row.Business;
    const businessRecord = business as Record<string, unknown> | null;
    return {
      id: String(row.id),
      businessId: String(row.business_id),
      businessName: String(businessRecord?.businessName ?? '—'),
      merchantEmail: String(businessRecord?.email || businessRecord?.workEmail || '—'),
      merchantMobile: String(businessRecord?.mobile ?? '—'),
      registrationNumber: businessRecord?.registrationNumber
        ? String(businessRecord.registrationNumber)
        : null,
      plan: String(row.plan),
      planName: getPlanDisplayName(String(row.plan)),
      billingCycle: String(row.billing_cycle),
      amountPaise: Number(row.amount_paise),
      amountDisplay: formatAmountInr(Number(row.amount_paise)),
      status: String(row.status),
      orderId: row.order_id ? String(row.order_id) : null,
      paymentId: row.payment_id ? String(row.payment_id) : null,
      subscriptionId: row.razorpay_subscription_id ? String(row.razorpay_subscription_id) : null,
      paymentType: String(row.payment_type || 'one_time'),
      source: row.source ? String(row.source) : null,
      planStartedAt: row.plan_started_at ? String(row.plan_started_at) : null,
      planExpiresAt: row.plan_expires_at ? String(row.plan_expires_at) : null,
      createdAt: String(row.created_at),
    };
  });

  const total = count ?? 0;
  return {
    success: true as const,
    payments,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getAdminPaymentStats() {
  const auth = await assertAdminSession();
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return { success: false as const, error: 'Admin service is not configured' };
  }

  const [completedRes, pendingRes, failedRes, revenueRes] = await Promise.all([
    supabase.from('merchant_payments').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('merchant_payments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('merchant_payments').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
    supabase.from('merchant_payments').select('amount_paise').eq('status', 'completed'),
  ]);

  const totalRevenuePaise = (revenueRes.data ?? []).reduce(
    (sum, row) => sum + Number(row.amount_paise || 0),
    0
  );

  return {
    success: true as const,
    stats: {
      completed: completedRes.count ?? 0,
      pending: pendingRes.count ?? 0,
      failed: failedRes.count ?? 0,
      totalRevenueDisplay: formatAmountInr(totalRevenuePaise),
    },
  };
}
