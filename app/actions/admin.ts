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
import { canViewAllAdminLoginLogs, canViewAllAdminAuditLogs } from '@/lib/admin/roles';
import { recordAdminLoginLog } from '@/lib/admin/loginLogs.server';
import type { AdminAuditAction } from '@/lib/admin/auditLog.server';
import { formatActivityLabels, parseFinderbTimestamp } from '@/lib/formatDateTime';

const PAYMENTS_PAGE_SIZE = 25;
const ACTIVITY_FETCH_LIMIT = 8;
const LOGIN_LOGS_PAGE_SIZE = 50;
const AUDIT_LOGS_PAGE_SIZE = 50;

export type AdminAuditLogRecord = {
  id: string;
  adminId: string;
  adminEmail: string;
  adminRole: string;
  action: AdminAuditAction;
  resourceType: string;
  resourceId: string | null;
  summary: string;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type AdminLoginLogRecord = {
  id: string;
  adminId: string;
  email: string;
  adminEmail: string | null;
  success: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type AdminActivityEventType =
  | 'user_joined'
  | 'partner_joined'
  | 'new_lead'
  | 'payment_completed';

export type AdminActivityEvent = {
  id: string;
  type: AdminActivityEventType;
  title: string;
  subtitle: string;
  occurredAt: string;
  occurredDateLabel: string;
  occurredTimeLabel: string;
  iconLetter: string;
};

function buildActivityEvent(
  event: Omit<AdminActivityEvent, 'occurredAt' | 'occurredDateLabel' | 'occurredTimeLabel'> & {
    occurredAtRaw: string | Date | null | undefined;
  }
): AdminActivityEvent {
  const labels = formatActivityLabels(event.occurredAtRaw);
  const { occurredAtRaw, ...rest } = event;
  return {
    ...rest,
    occurredAt: labels.occurredAt,
    occurredDateLabel: labels.occurredDateLabel,
    occurredTimeLabel: labels.occurredTimeLabel,
  };
}

function activityIconLetter(value: string) {
  const letter = value.trim().charAt(0).toUpperCase();
  return letter || '?';
}

function mergeActivityEvents(events: AdminActivityEvent[], limit: number) {
  return events
    .sort((a, b) => {
      const aTime = parseFinderbTimestamp(a.occurredAt)?.getTime() ?? 0;
      const bTime = parseFinderbTimestamp(b.occurredAt)?.getTime() ?? 0;
      return bTime - aTime;
    })
    .slice(0, limit);
}

export async function getAdminActivityEvents(limit = ACTIVITY_FETCH_LIMIT) {
  const auth = await assertAdminSession();
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return { success: false as const, error: 'Admin service is not configured' };
  }

  const perSource = Math.max(limit, 5);

  const [usersRes, businessesRes, leadsRes, paymentsRes] = await Promise.all([
    supabase
      .from('User')
      .select('id, fullName, email, createdAt')
      .order('createdAt', { ascending: false })
      .limit(perSource),
    supabase
      .from('Business')
      .select('id, businessName, email, workEmail, createdAt')
      .order('createdAt', { ascending: false })
      .limit(perSource),
    supabase
      .from('leads')
      .select('id, name, email, category, created_at')
      .order('created_at', { ascending: false })
      .limit(perSource),
    supabase
      .from('merchant_payments')
      .select('id, plan, billing_cycle, amount_paise, status, created_at, Business:business_id (businessName)')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(perSource),
  ]);

  const events: AdminActivityEvent[] = [];

  for (const user of usersRes.data ?? []) {
    const name = String(user.fullName ?? 'User');
    const email = String(user.email ?? '');
    events.push(
      buildActivityEvent({
        id: `user-${user.id}`,
        type: 'user_joined',
        title: 'New User Joined',
        subtitle: email ? `${name} (${email})` : name,
        occurredAtRaw: user.createdAt,
        iconLetter: activityIconLetter(name),
      })
    );
  }

  for (const business of businessesRes.data ?? []) {
    const name = String(business.businessName ?? 'Business');
    const email = String(business.email || business.workEmail || '');
    events.push(
      buildActivityEvent({
        id: `business-${business.id}`,
        type: 'partner_joined',
        title: 'New Partner Joined',
        subtitle: email ? `${name} (${email})` : name,
        occurredAtRaw: business.createdAt,
        iconLetter: activityIconLetter(name),
      })
    );
  }

  for (const lead of leadsRes.data ?? []) {
    const name = String(lead.name ?? 'Lead');
    const category = String(lead.category ?? 'General');
    const email = lead.email ? String(lead.email) : '';
    events.push(
      buildActivityEvent({
        id: `lead-${lead.id}`,
        type: 'new_lead',
        title: 'New Lead',
        subtitle: email ? `${name} · ${category} (${email})` : `${name} · ${category}`,
        occurredAtRaw: lead.created_at,
        iconLetter: activityIconLetter(name),
      })
    );
  }

  for (const payment of paymentsRes.data ?? []) {
    const business = Array.isArray(payment.Business) ? payment.Business[0] : payment.Business;
    const businessName = String((business as { businessName?: string } | null)?.businessName ?? 'Merchant');
    events.push(
      buildActivityEvent({
        id: `payment-${payment.id}`,
        type: 'payment_completed',
        title: 'Plan Recharge Completed',
        subtitle: `${businessName} · ${getPlanDisplayName(String(payment.plan), String(payment.billing_cycle))} (${formatAmountInr(Number(payment.amount_paise))})`,
        occurredAtRaw: payment.created_at,
        iconLetter: activityIconLetter(businessName),
      })
    );
  }

  return {
    success: true as const,
    events: mergeActivityEvents(events, limit),
  };
}

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
      await recordAdminLoginLog({
        adminId: admin.id,
        email: normalizedEmail,
        success: false,
      });
      return { success: false as const, error: 'Incorrect password.' };
    }

    if (verification.needsRehash) {
      const hashedPassword = await hashPassword(password);
      await supabase.from('admins').update({ password: hashedPassword }).eq('id', admin.id);
    }

    await setAdminSessionCookie(admin.id);
    await recordAdminLoginLog({
      adminId: admin.id,
      email: normalizedEmail,
      success: true,
    });
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

export async function getAdminLoginLogs(filters: { page?: number } = {}) {
  const auth = await assertAdminSession();
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  const session = await getAdminSession();
  if (!session) {
    return { success: false as const, error: 'Unauthorized' };
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return { success: false as const, error: 'Admin service is not configured' };
  }

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = LOGIN_LOGS_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const viewAll = canViewAllAdminLoginLogs(session.role, session.email);

  let query = supabase
    .from('admin_login_logs')
    .select(
      `
      id,
      admin_id,
      email,
      success,
      ip_address,
      user_agent,
      created_at,
      admins:admin_id (email)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (!viewAll) {
    query = query.eq('admin_id', auth.adminId);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[admin] login logs fetch failed:', error);
    return { success: false as const, error: 'Could not load login logs' };
  }

  const logs: AdminLoginLogRecord[] = (data ?? []).map((row) => {
    const adminRow = Array.isArray(row.admins) ? row.admins[0] : row.admins;
    return {
      id: String(row.id),
      adminId: String(row.admin_id),
      email: String(row.email),
      adminEmail: adminRow?.email ? String(adminRow.email) : null,
      success: Boolean(row.success),
      ipAddress: row.ip_address ? String(row.ip_address) : null,
      userAgent: row.user_agent ? String(row.user_agent) : null,
      createdAt: String(row.created_at),
    };
  });

  const total = count ?? 0;
  return {
    success: true as const,
    logs,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    viewAll,
  };
}

export async function getAdminAuditLogs(filters: { page?: number } = {}) {
  const auth = await assertAdminSession();
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  const session = await getAdminSession();
  if (!session) {
    return { success: false as const, error: 'Unauthorized' };
  }

  const viewAll = canViewAllAdminAuditLogs(session.role, session.email);

  const supabase = createServiceClient();
  if (!supabase) {
    return { success: false as const, error: 'Admin service is not configured' };
  }

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = AUDIT_LOGS_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('admin_audit_logs')
    .select(
      `
      id,
      admin_id,
      admin_email,
      admin_role,
      action,
      resource_type,
      resource_id,
      summary,
      metadata,
      ip_address,
      user_agent,
      created_at
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (!viewAll) {
    query = query.eq('admin_id', auth.adminId);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[admin] audit logs fetch failed:', error);
    return { success: false as const, error: 'Could not load audit logs' };
  }

  const logs: AdminAuditLogRecord[] = (data ?? []).map((row) => ({
    id: String(row.id),
    adminId: String(row.admin_id),
    adminEmail: String(row.admin_email),
    adminRole: String(row.admin_role),
    action: row.action as AdminAuditAction,
    resourceType: String(row.resource_type),
    resourceId: row.resource_id ? String(row.resource_id) : null,
    summary: String(row.summary),
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    ipAddress: row.ip_address ? String(row.ip_address) : null,
    userAgent: row.user_agent ? String(row.user_agent) : null,
    createdAt: String(row.created_at),
  }));

  const total = count ?? 0;
  return {
    success: true as const,
    logs,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    viewAll,
  };
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
      planName: getPlanDisplayName(String(row.plan), String(row.billing_cycle)),
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
