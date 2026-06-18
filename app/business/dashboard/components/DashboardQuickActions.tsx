'use client';

import Link from 'next/link';
import { HiOutlineChevronRight } from 'react-icons/hi2';
import { dashboard } from './dashboard-ui';

type QuickAction = {
  label: string;
  description: string;
  onClick?: () => void;
  href?: string;
};

type DashboardQuickActionsProps = {
  actions: QuickAction[];
};

export default function DashboardQuickActions({ actions }: DashboardQuickActionsProps) {
  return (
    <div>
      <p className={dashboard.sectionTitle}>Shortcuts</p>
      <ul className={`mt-3 ${dashboard.surface}`}>
        {actions.map((action) => {
          const inner = (
            <>
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900">{action.label}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{action.description}</p>
              </div>
              <HiOutlineChevronRight size={16} className="shrink-0 text-zinc-400" />
            </>
          );

          return (
            <li key={action.label}>
              {action.href ? (
                <Link href={action.href} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-zinc-50">
                  {inner}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={action.onClick}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-zinc-50"
                >
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
