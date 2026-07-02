'use client';

import {
  HiOutlineBriefcase,
  HiOutlineCreditCard,
  HiOutlineCursorArrowRays,
  HiOutlineQueueList,
} from 'react-icons/hi2';

type DashboardAtAGlanceProps = {
  isPaymentActive: boolean;
  planName?: string;
  newLeadCount?: number;
  activeJobsCount?: number;
  onOpenLeads: () => void;
  onOpenJobs: () => void;
  onOpenListing: () => void;
  onOpenBilling?: () => void;
};

export default function DashboardAtAGlance({
  isPaymentActive,
  planName = 'Starter',
  newLeadCount = 0,
  activeJobsCount = 0,
  onOpenLeads,
  onOpenJobs,
  onOpenListing,
  onOpenBilling,
}: DashboardAtAGlanceProps) {
  const items = [
    {
      label: planName,
      value: isPaymentActive ? 'Active' : 'Inactive',
      onClick: onOpenBilling ?? onOpenListing,
      icon: HiOutlineCreditCard,
    },
    {
      label: 'Live jobs',
      value: String(activeJobsCount),
      onClick: onOpenJobs,
      icon: HiOutlineBriefcase,
    },
    {
      label: 'Listing',
      value: 'Open',
      onClick: onOpenListing,
      icon: HiOutlineQueueList,
    },
    {
      label: 'New leads',
      value: newLeadCount > 0 ? String(newLeadCount) : '—',
      onClick: onOpenLeads,
      icon: HiOutlineCursorArrowRays,
    },
  ];

  return (
    <div className="flex flex-wrap gap-x-1 gap-y-2 text-sm">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <span key={item.label} className="inline-flex items-center">
            {i > 0 && <span className="mx-2 text-zinc-300" aria-hidden>|</span>}
            <button
              type="button"
              onClick={item.onClick}
              className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-[#215481]"
            >
              <Icon size={15} className="shrink-0" />
              <span className="font-medium text-zinc-800">{item.label}</span>
              <span className="text-zinc-500">{item.value}</span>
            </button>
          </span>
        );
      })}
    </div>
  );
}
