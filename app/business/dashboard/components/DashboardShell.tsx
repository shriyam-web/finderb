'use client';

import { dashboard } from './dashboard-ui';

type DashboardPanelProps = {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
  hover?: boolean;
  padding?: boolean;
};

export function DashboardPanel({
  children,
  className = '',
  accent = false,
  hover = false,
  padding = true,
}: DashboardPanelProps) {
  return (
    <div className={`${dashboard.panel} ${hover ? dashboard.panelHover : ''} ${className}`}>
      {accent && <div className={dashboard.accentBar} aria-hidden />}
      <div className={padding ? 'p-5 md:p-6' : ''}>{children}</div>
    </div>
  );
}

type DashboardSectionHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function DashboardSectionHeader({ title, description, action }: DashboardSectionHeaderProps) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-base font-semibold tracking-tight text-zinc-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-zinc-600">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export default function DashboardTabShell({ children }: { children: React.ReactNode }) {
  return <div className={`space-y-6 ${dashboard.tabEnter}`}>{children}</div>;
}
