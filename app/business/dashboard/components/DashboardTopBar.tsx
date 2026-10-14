'use client';

import { HiOutlineBars3, HiOutlineBell } from 'react-icons/hi2';
import { formatDateTimeInr } from '@/lib/formatDateTime';
import {
  broadcastShowsDatetime,
  resolveBroadcastCta,
} from '@/lib/broadcastFields';

const tabMeta: Record<string, { title: string; description: string }> = {
  overview: {
    title: 'Overview',
    description: 'Performance, readiness, and incoming enquiries at a glance.',
  },
  listings: {
    title: 'My Listing',
    description: 'Preview and manage how customers see your business.',
  },
  leads: {
    title: 'Leads',
    description: 'Respond to FinderB enquiries and job applications.',
  },
  reviews: {
    title: 'Reviews',
    description: 'Read customer feedback and reply on your public listing.',
  },
  jobs: {
    title: 'Jobs',
    description: 'Create and manage open roles for your business.',
  },
  messages: {
    title: 'Messages',
    description: 'Conversations with customers on FinderB.',
  },
  settings: {
    title: 'Settings',
    description: 'Profile, documents, and account preferences.',
  },
  subscription: {
    title: 'My Subscription',
    description: '',
  },
};

type DashboardNotification = {
  id?: string;
  title?: string;
  message: string;
  created_at: string;
  cta_url?: string | null;
  cta_label?: string | null;
  show_datetime?: boolean | null;
  read?: boolean;
};

type DashboardTopBarProps = {
  activeTab: string;
  unreadCount: number;
  isNotificationsOpen: boolean;
  onNotificationsToggle: () => void;
  onNotificationsClose: () => void;
  onOpenNotification?: (item: DashboardNotification) => void;
  onMarkAllRead?: () => void;
  notifications: DashboardNotification[];
  onOpenMenu?: () => void;
};

function itemCta(n: DashboardNotification) {
  const url = (n.cta_url || '').trim();
  if (url.startsWith('/')) {
    return { url, label: n.cta_label || 'Open', internal: true };
  }
  const remote = resolveBroadcastCta(n);
  return remote ? { ...remote, internal: false } : null;
}

export default function DashboardTopBar({
  activeTab,
  unreadCount,
  isNotificationsOpen,
  onNotificationsToggle,
  onNotificationsClose,
  onOpenNotification,
  onMarkAllRead,
  notifications,
  onOpenMenu,
}: DashboardTopBarProps) {
  const meta = tabMeta[activeTab] || { title: activeTab, description: '' };

  return (
    <header className="mb-6 flex flex-col gap-3 border-b border-zinc-200 pb-5 sm:flex-row sm:items-end sm:justify-between md:mb-8">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 md:text-2xl">{meta.title}</h1>
        {meta.description && (
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">{meta.description}</p>
        )}
      </div>

      <div className="relative flex shrink-0 items-center gap-2">
        {onOpenMenu ? (
          <button
            type="button"
            onClick={onOpenMenu}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 lg:hidden"
            aria-label="Open more"
          >
            <HiOutlineBars3 size={18} />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onNotificationsToggle}
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-900"
          aria-expanded={isNotificationsOpen}
        >
          <HiOutlineBell size={18} className="text-[#215481]" />
          Alerts
          {unreadCount > 0 && (
            <span className="rounded-full bg-[#f9b864] px-1.5 py-0.5 text-[10px] font-bold text-[#153551]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {isNotificationsOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={onNotificationsClose} />
            <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-zinc-900">Notifications</h3>
                {unreadCount > 0 && onMarkAllRead ? (
                  <button
                    type="button"
                    onClick={onMarkAllRead}
                    className="text-[11px] font-semibold text-[#215481] hover:underline"
                  >
                    Mark all as read
                  </button>
                ) : null}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => {
                    const cta = itemCta(n);
                    return (
                    <button
                      type="button"
                      key={n.id || `${n.title}-${n.created_at}`}
                      onClick={() => onOpenNotification?.(n)}
                      className={`block w-full border-b border-zinc-50 px-4 py-3 text-left last:border-0 hover:bg-amber-50/40 ${n.read === false ? 'bg-[#fff8ee]' : ''}`}
                    >
                      <p className="text-sm font-medium text-zinc-900">{n.title || 'Notification'}</p>
                      <p className="mt-0.5 text-xs text-zinc-600">{n.message}</p>
                      {cta ? (
                        <span className="mt-2 inline-flex rounded-md bg-[#215481] px-2.5 py-1 text-[11px] font-semibold text-white">
                          {cta.label}
                        </span>
                      ) : null}
                      {broadcastShowsDatetime(n.show_datetime) ? (
                        <p className="mt-1 text-[11px] text-zinc-400">
                          {formatDateTimeInr(n.created_at)}
                        </p>
                      ) : null}
                    </button>
                    );
                  })
                ) : (
                  <p className="px-4 py-10 text-center text-sm text-zinc-500">No new alerts</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
