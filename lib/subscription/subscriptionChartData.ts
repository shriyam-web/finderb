import type { MerchantPaymentHistoryItem } from '@/app/actions/subscription';
import { parseFinderbTimestamp } from '@/lib/formatDateTime';
import { formatSubscriptionDate } from '@/lib/subscription/merchantSubscription';

export type MonthlySpendBucket = {
  key: string;
  label: string;
  amountPaise: number;
  paymentCount: number;
};

export type BillingChartPoint = {
  key: string;
  label: string;
  amount: number;
  payments: number;
  cumulative: number;
};

export type PaymentTypeSlice = {
  id: string;
  label: string;
  value: number;
  amountPaise: number;
  color: string;
};

export type PeriodProgress = {
  totalDays: number;
  elapsedDays: number;
  remainingDays: number;
  percentUsed: number;
  startLabel: string;
  endLabel: string;
};

export type CoverageSegment = {
  id: string;
  planName: string;
  start: Date;
  end: Date;
  startMs: number;
  endMs: number;
};

const MONTH_WINDOW = 12;

const PAYMENT_TYPE_META: Record<string, { label: string; color: string }> = {
  one_time: { label: 'Annual / one-time', color: '#215481' },
  subscription_auth: { label: 'Auto-debit setup', color: '#4f8dc3' },
  subscription_renewal: { label: 'Monthly renewal', color: '#f9b864' },
};

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function buildMonthlySpendBuckets(
  history: MerchantPaymentHistoryItem[],
  windowSize = MONTH_WINDOW,
): MonthlySpendBucket[] {
  const now = new Date();
  const buckets: MonthlySpendBucket[] = [];

  for (let offset = windowSize - 1; offset >= 0; offset -= 1) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    buckets.push({
      key: monthKey(monthStart),
      label: monthStart.toLocaleDateString('en-IN', { month: 'short' }),
      amountPaise: 0,
      paymentCount: 0,
    });
  }

  for (const item of history) {
    if (item.status !== 'completed') continue;
    const paidAt = new Date(item.createdAt);
    if (Number.isNaN(paidAt.getTime())) continue;
    const key = monthKey(paidAt);
    const bucket = buckets.find((entry) => entry.key === key);
    if (!bucket) continue;
    bucket.amountPaise += item.amountPaise;
    bucket.paymentCount += 1;
  }

  return buckets;
}

export function buildBillingChartSeries(
  history: MerchantPaymentHistoryItem[],
  windowSize = MONTH_WINDOW,
): BillingChartPoint[] {
  const buckets = buildMonthlySpendBuckets(history, windowSize);
  let runningTotal = 0;

  return buckets.map((bucket) => {
    const amount = bucket.amountPaise / 100;
    runningTotal += amount;
    return {
      key: bucket.key,
      label: bucket.label,
      amount,
      payments: bucket.paymentCount,
      cumulative: runningTotal,
    };
  });
}

export function buildPaymentTypeBreakdown(history: MerchantPaymentHistoryItem[]): PaymentTypeSlice[] {
  const totals = new Map<string, { count: number; amountPaise: number }>();

  for (const item of history) {
    if (item.status !== 'completed') continue;
    const type = item.paymentType || 'one_time';
    const current = totals.get(type) ?? { count: 0, amountPaise: 0 };
    current.count += 1;
    current.amountPaise += item.amountPaise;
    totals.set(type, current);
  }

  return Array.from(totals.entries())
    .map(([id, stats]) => {
      const meta = PAYMENT_TYPE_META[id] ?? { label: 'Other', color: '#a1a1aa' };
      return {
        id,
        label: meta.label,
        value: stats.count,
        amountPaise: stats.amountPaise,
        color: meta.color,
      };
    })
    .sort((a, b) => b.amountPaise - a.amountPaise);
}

export function formatInrAxis(value: number) {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
  return `₹${Math.round(value)}`;
}

export function buildPeriodProgress(
  startedAt: string | Date | null | undefined,
  expiresAt: string | Date | null | undefined,
  daysRemaining: number | null,
  now = new Date(),
): PeriodProgress | null {
  const start = startedAt ? new Date(startedAt) : null;
  const end = expiresAt ? new Date(expiresAt) : null;
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  if (end.getTime() <= start.getTime()) return null;

  const startDay = new Date(start);
  startDay.setHours(0, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const totalMs = endDay.getTime() - startDay.getTime();
  const totalDays = Math.max(1, Math.round(totalMs / (1000 * 60 * 60 * 24)));
  const elapsedMs = Math.min(Math.max(today.getTime() - startDay.getTime(), 0), totalMs);
  const elapsedDays = Math.round(elapsedMs / (1000 * 60 * 60 * 24));
  const remainingDays = daysRemaining ?? Math.max(0, totalDays - elapsedDays);
  const percentUsed = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));

  return {
    totalDays,
    elapsedDays,
    remainingDays,
    percentUsed,
    startLabel: formatShortDate(start),
    endLabel: formatShortDate(end),
  };
}

export function formatCoverageDateRange(start: Date, end: Date): string {
  return `${formatSubscriptionDate(start)} – ${formatSubscriptionDate(end)}`;
}

export function buildCoverageSegments(
  history: MerchantPaymentHistoryItem[],
  currentPeriod?: {
    planName: string;
    startedAt: string | null;
    expiresAt: string | null;
  },
): CoverageSegment[] {
  const segments: CoverageSegment[] = [];

  for (const item of history) {
    if (item.status !== 'completed' || !item.planStartedAt || !item.planExpiresAt) continue;
    const start = parseFinderbTimestamp(item.planStartedAt);
    const end = parseFinderbTimestamp(item.planExpiresAt);
    if (!start || !end || end <= start) continue;
    segments.push({
      id: item.id,
      planName: item.planName,
      start,
      end,
      startMs: start.getTime(),
      endMs: end.getTime(),
    });
  }

  if (currentPeriod?.startedAt && currentPeriod.expiresAt && currentPeriod.planName) {
    const start = parseFinderbTimestamp(currentPeriod.startedAt);
    const end = parseFinderbTimestamp(currentPeriod.expiresAt);
    if (start && end && end > start) {
      const matchesExisting = segments.some(
        (segment) =>
          Math.abs(segment.startMs - start.getTime()) < 24 * 60 * 60 * 1000 &&
          Math.abs(segment.endMs - end.getTime()) < 24 * 60 * 60 * 1000,
      );
      if (!matchesExisting) {
        segments.push({
          id: 'current-period',
          planName: currentPeriod.planName,
          start,
          end,
          startMs: start.getTime(),
          endMs: end.getTime(),
        });
      }
    }
  }

  return segments.sort((a, b) => a.startMs - b.startMs);
}

export function getChartMaxValue(buckets: MonthlySpendBucket[], mode: 'amount' | 'count') {
  const values = buckets.map((bucket) => (mode === 'amount' ? bucket.amountPaise : bucket.paymentCount));
  return Math.max(...values, mode === 'amount' ? 100 : 1);
}
