'use client';

import {
  HiOutlineArrowTrendingUp,
  HiOutlineArrowUpRight,
  HiOutlineEye,
  HiOutlineUsers,
} from 'react-icons/hi2';

type Kpi = {
  id: string;
  label: string;
  value: string;
  delta: string;
  deltaUp: boolean;
  context: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

type DashboardKpiRowProps = {
  kpis: Kpi[];
};

const kpiAccent: Record<string, string> = {
  views: 'from-[#153551] to-[#215481]',
  leads: 'from-[#c1621a] to-[#f9b864]',
  rating: 'from-violet-700 to-indigo-600',
};

/** Performance metrics only — shown once on Overview. */
export default function DashboardKpiRow({ kpis }: DashboardKpiRowProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {kpis.map((kpi) => {
        const gradient = kpiAccent[kpi.id] || kpiAccent.views;

        return (
          <div
            key={kpi.id}
            className={`relative overflow-hidden rounded-xl bg-gradient-to-br p-5 text-white shadow-lg ${gradient}`}
          >
            <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex items-start justify-between">
              <div className="rounded-lg bg-white/15 p-2 backdrop-blur-sm">
                <kpi.icon size={18} />
              </div>
              <span className="inline-flex items-center gap-0.5 rounded-md bg-white/15 px-2 py-0.5 text-[11px] font-semibold backdrop-blur-sm">
                {kpi.deltaUp && <HiOutlineArrowUpRight size={11} />}
                {kpi.delta}
              </span>
            </div>
            <p className="relative mt-4 text-3xl font-bold tabular-nums tracking-tight">{kpi.value}</p>
            <p className="relative mt-0.5 text-sm font-semibold text-white/95">{kpi.label}</p>
            <p className="relative mt-1 text-xs text-white/70">{kpi.context}</p>
          </div>
        );
      })}
    </div>
  );
}

export function buildDefaultKpis(leadCount: number, rating: number) {
  return [
    {
      id: 'views',
      label: 'Profile views',
      value: '1,284',
      delta: '+12.5%',
      deltaUp: true,
      context: 'Last 30 days',
      icon: HiOutlineEye,
    },
    {
      id: 'leads',
      label: 'Total leads',
      value: String(leadCount),
      delta: leadCount > 0 ? 'Live' : '—',
      deltaUp: leadCount > 0,
      context: 'All time on FinderB',
      icon: HiOutlineUsers,
    },
    {
      id: 'rating',
      label: 'Average rating',
      value: rating.toFixed(1),
      delta: 'of 5.0',
      deltaUp: true,
      context: 'Customer reviews',
      icon: HiOutlineArrowTrendingUp,
    },
  ];
}
