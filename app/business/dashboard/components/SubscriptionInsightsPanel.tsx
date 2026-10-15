'use client';

import { useMemo, useState } from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MerchantPaymentHistoryItem } from '@/app/actions/subscription';
import { formatInr } from '@/lib/pricing/growthPro';
import {
  buildBillingChartSeries,
  buildCoverageSegments,
  buildPaymentTypeBreakdown,
  buildPeriodProgress,
  formatCoverageDateRange,
  formatInrAxis,
  type BillingChartPoint,
  type PaymentTypeSlice,
} from '@/lib/subscription/subscriptionChartData';
import { dashboard } from './dashboard-ui';

type ChartMode = 'flow' | 'cumulative';

type SubscriptionInsightsPanelProps = {
  history: MerchantPaymentHistoryItem[];
  startedAt: string | null;
  expiresAt: string | null;
  daysRemaining: number | null;
  isActive: boolean;
  planName: string;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload?: BillingChartPoint }>;
  mode: ChartMode;
};

function BillingTooltip({ active, payload, mode }: ChartTooltipProps) {
  if (!active || !payload?.length || !payload[0]?.payload) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-semibold text-zinc-900">{point.label}</p>
      <p className="mt-1 text-zinc-600">
        Spent: <span className="font-medium text-zinc-900">{formatInr(point.amount)}</span>
      </p>
      <p className="text-zinc-600">
        Payments: <span className="font-medium text-zinc-900">{point.payments}</span>
      </p>
      {mode === 'cumulative' && (
        <p className="mt-1 border-t border-zinc-100 pt-1 text-zinc-600">
          Running total:{' '}
          <span className="font-medium text-[#3F3F46]">{formatInr(point.cumulative)}</span>
        </p>
      )}
    </div>
  );
}

type DonutTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload?: PaymentTypeSlice }>;
};

function DonutTooltip({ active, payload }: DonutTooltipProps) {
  if (!active || !payload?.length || !payload[0]?.payload) return null;
  const slice = payload[0].payload;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-semibold text-zinc-900">{slice.label}</p>
      <p className="mt-1 text-zinc-600">
        {slice.value} payment{slice.value === 1 ? '' : 's'} · {formatInr(slice.amountPaise / 100)}
      </p>
    </div>
  );
}

function BillingTrendChart({
  data,
  mode,
}: {
  data: BillingChartPoint[];
  mode: ChartMode;
}) {
  const hasSpend = data.some((point) => point.amount > 0 || point.payments > 0);
  const maxAmount = Math.max(...data.map((point) => point.amount), 1);
  const maxCumulative = Math.max(...data.map((point) => point.cumulative), 1);

  if (!hasSpend) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50/80 text-sm text-zinc-500">
        No billing activity in the last 12 months yet
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="billingAreaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3F3F46" stopOpacity={0.42} />
              <stop offset="55%" stopColor="#71717A" stopOpacity={0.14} />
              <stop offset="100%" stopColor="#71717A" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="billingBarFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#27272A" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#3F3F46" stopOpacity={0.55} />
            </linearGradient>
            <filter id="billingGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <CartesianGrid stroke="#ececef" strokeDasharray="4 6" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#71717a', fontSize: 11 }}
            dy={8}
          />
          <YAxis
            yAxisId="amount"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#a1a1aa', fontSize: 11 }}
            tickFormatter={formatInrAxis}
            domain={[0, Math.ceil(maxAmount * 1.2)]}
            width={48}
          />
          {mode === 'cumulative' && (
            <YAxis
              yAxisId="cumulative"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#a1a1aa', fontSize: 11 }}
              tickFormatter={formatInrAxis}
              domain={[0, Math.ceil(maxCumulative * 1.1)]}
              width={48}
            />
          )}

          <Tooltip
            cursor={{ stroke: '#3F3F46', strokeWidth: 1, strokeDasharray: '4 4' }}
            content={<BillingTooltip mode={mode} />}
          />

          <Bar
            yAxisId="amount"
            dataKey="amount"
            barSize={14}
            radius={[6, 6, 0, 0]}
            fill="url(#billingBarFill)"
            opacity={mode === 'flow' ? 0.85 : 0.35}
          />

          <Area
            yAxisId="amount"
            type="monotone"
            dataKey="amount"
            stroke="#3F3F46"
            strokeWidth={2.5}
            fill="url(#billingAreaFill)"
            activeDot={{ r: 5, fill: '#27272A', stroke: '#fff', strokeWidth: 2 }}
          />

          {mode === 'cumulative' && (
            <Line
              yAxisId="cumulative"
              type="monotone"
              dataKey="cumulative"
              stroke="#f9b864"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#f9b864', stroke: '#fff', strokeWidth: 1.5 }}
              activeDot={{ r: 5, fill: '#e8a045', stroke: '#fff', strokeWidth: 2 }}
              filter="url(#billingGlow)"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function PaymentMixDonut({ slices }: { slices: PaymentTypeSlice[] }) {
  if (slices.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-zinc-500">
        No paid transactions yet
      </div>
    );
  }

  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative mx-auto h-[200px] w-[200px] shrink-0 sm:mx-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<DonutTooltip />} />
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={82}
              paddingAngle={3}
              cornerRadius={4}
              stroke="#fff"
              strokeWidth={2}
            >
              {slices.map((slice) => (
                <Cell key={slice.id} fill={slice.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-semibold tabular-nums text-zinc-900">{total}</span>
          <span className="text-[11px] text-zinc-500">payments</span>
        </div>
      </div>

      <div className="flex-1 space-y-2">
        {slices.map((slice) => {
          const pct = total > 0 ? Math.round((slice.value / total) * 100) : 0;
          return (
            <div key={slice.id} className="flex items-center gap-3 text-sm">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-zinc-800">{slice.label}</span>
                  <span className="shrink-0 tabular-nums text-zinc-500">{pct}%</span>
                </div>
                <p className="text-xs text-zinc-500">
                  {slice.value} · {formatInr(slice.amountPaise / 100)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PeriodRadialGauge({
  percentUsed,
  remainingDays,
  planName,
}: {
  percentUsed: number;
  remainingDays: number;
  planName: string;
}) {
  const gaugeData = [{ name: 'used', value: percentUsed, fill: '#3F3F46' }];

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-[148px] w-[148px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="72%"
            outerRadius="100%"
            barSize={10}
            data={gaugeData}
            startAngle={220}
            endAngle={-40}
          >
            <RadialBar
              background={{ fill: '#f4f4f5' }}
              dataKey="value"
              cornerRadius={8}
              fill="#3F3F46"
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-semibold tabular-nums text-zinc-900">{remainingDays}</span>
          <span className="text-[11px] text-zinc-500">days left</span>
        </div>
      </div>
      <div className="min-w-0 text-sm">
        <p className="font-medium text-zinc-900">{planName}</p>
        <p className="mt-1 text-zinc-600">{Math.round(percentUsed)}% of billing period elapsed</p>
        <p className="mt-2 text-xs text-zinc-500">Arc fills as your current plan period progresses</p>
      </div>
    </div>
  );
}

function CoverageTimeline({
  segments,
  rangeStart,
  rangeEnd,
}: {
  segments: ReturnType<typeof buildCoverageSegments>;
  rangeStart: number;
  rangeEnd: number;
}) {
  const span = Math.max(rangeEnd - rangeStart, 1);

  return (
    <div className="space-y-3">
      <div className="relative h-2.5 overflow-hidden rounded-full bg-zinc-100">
        {segments.map((segment, index) => {
          const left = ((segment.startMs - rangeStart) / span) * 100;
          const width = ((segment.endMs - segment.startMs) / span) * 100;
          const tone = index % 2 === 0 ? 'bg-[#3F3F46]' : 'bg-[#71717A]';

          return (
            <div
              key={segment.id}
              className={`absolute top-0 h-full ${tone}`}
              style={{ left: `${left}%`, width: `${Math.max(width, 1.5)}%` }}
              title={`${segment.planName}: ${formatCoverageDateRange(segment.start, segment.end)}`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600">
        {segments.map((segment) => (
          <span key={segment.id}>
            {segment.planName}{' '}
            <span className="text-zinc-400">({formatCoverageDateRange(segment.start, segment.end)})</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SubscriptionInsightsPanel({
  history,
  startedAt,
  expiresAt,
  daysRemaining,
  isActive,
  planName,
}: SubscriptionInsightsPanelProps) {
  const [mode, setMode] = useState<ChartMode>('flow');

  const chartSeries = useMemo(() => buildBillingChartSeries(history), [history]);
  const paymentMix = useMemo(() => buildPaymentTypeBreakdown(history), [history]);
  const period = useMemo(
    () => buildPeriodProgress(startedAt, expiresAt, daysRemaining),
    [startedAt, expiresAt, daysRemaining],
  );
  const coverageSegments = useMemo(
    () =>
      buildCoverageSegments(history, {
        planName,
        startedAt,
        expiresAt,
      }),
    [history, planName, startedAt, expiresAt],
  );

  const completed = history.filter((item) => item.status === 'completed');
  const totalPaidPaise = completed.reduce((sum, item) => sum + item.amountPaise, 0);
  const monthsWithSpend = chartSeries.filter((point) => point.amount > 0).length;
  const avgMonthlyPaise = monthsWithSpend > 0 ? totalPaidPaise / monthsWithSpend : 0;

  const coverageRange = useMemo(() => {
    if (coverageSegments.length === 0) {
      const start = startedAt ? new Date(startedAt).getTime() : Date.now();
      const end = expiresAt ? new Date(expiresAt).getTime() : Date.now();
      return { start, end };
    }
    return {
      start: coverageSegments[0].startMs,
      end: coverageSegments[coverageSegments.length - 1].endMs,
    };
  }, [coverageSegments, startedAt, expiresAt]);

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-900">Billing analytics</h2>
        <p className="text-sm text-zinc-600">
          {completed.length} paid · {formatInr(totalPaidPaise / 100)} lifetime
          {monthsWithSpend > 0 && (
            <span className="text-zinc-400"> · avg {formatInr(avgMonthlyPaise / 100)}/mo</span>
          )}
        </p>
      </div>

      <div className={`${dashboard.panel} mt-3 overflow-hidden`}>
        <div className="border-b border-zinc-100 px-5 py-4 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-zinc-900">12-month billing pulse</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Area + bars show monthly spend; switch to cumulative for lifetime curve
              </p>
            </div>
            <div className={dashboard.segmentGroup} role="tablist" aria-label="Chart mode">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'flow'}
                className={`${dashboard.segmentBtn} ${mode === 'flow' ? dashboard.segmentActive : dashboard.segmentInactive}`}
                onClick={() => setMode('flow')}
              >
                Monthly flow
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'cumulative'}
                className={`${dashboard.segmentBtn} ${mode === 'cumulative' ? dashboard.segmentActive : dashboard.segmentInactive}`}
                onClick={() => setMode('cumulative')}
              >
                Cumulative
              </button>
            </div>
          </div>
          <div className="mt-4">
            <BillingTrendChart data={chartSeries} mode={mode} />
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-2">
          <div className="border-b border-zinc-100 p-5 md:p-6 lg:border-b-0 lg:border-r">
            <p className="text-sm font-medium text-zinc-900">Payment mix</p>
            <p className="mt-0.5 text-xs text-zinc-500">How your spend splits across billing types</p>
            <div className="mt-4">
              <PaymentMixDonut slices={paymentMix} />
            </div>
          </div>

          <div className="p-5 md:p-6">
            {isActive && period ? (
              <PeriodRadialGauge
                percentUsed={period.percentUsed}
                remainingDays={period.remainingDays}
                planName={planName}
              />
            ) : (
              <div className="text-sm">
                <p className="font-medium text-zinc-900">Current plan</p>
                <p className="mt-1 text-zinc-600">
                  {planName}
                  {period ? ` · valid until ${period.endLabel}` : ' · no active paid period'}
                </p>
              </div>
            )}

            {coverageSegments.length > 0 && (
              <div className="mt-6 space-y-2">
                <p className="text-sm font-medium text-zinc-900">Plan validity</p>
                <p className="text-xs text-zinc-500">
                  Each segment is a paid billing window — same &quot;Started&quot; and &quot;Valid until&quot; dates as plan
                  details.
                </p>
                <CoverageTimeline
                  segments={coverageSegments}
                  rangeStart={coverageRange.start}
                  rangeEnd={coverageRange.end}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
