'use client';

import { HiOutlineBell } from 'react-icons/hi2';

const tabMeta: Record<string, { title: string; description: string }> = {
  overview: {
    title: 'Overview',
    description: 'Performance, readiness, and incoming enquiries at a glance.',
  },
  listings: {
    title: 'Listing',
    description: 'Preview and manage how customers see your business.',
  },
  leads: {
    title: 'Leads',
    description: 'Respond to FinderB enquiries and job applications.',
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

type DashboardTopBarProps = {
  activeTab: string;
  unreadCount: number;
  isNotificationsOpen: boolean;
  onNotificationsToggle: () => void;
  onNotificationsClose: () => void;
  notifications: Array<{ title?: string; message: string; created_at: string }>;
};

export default function DashboardTopBar({
  activeTab,
  unreadCount,
  isNotificationsOpen,
  onNotificationsToggle,
  onNotificationsClose,
  notifications,
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

      <div className="relative shrink-0">
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
              <div className="border-b border-zinc-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-zinc-900">Notifications</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n, i) => (
                    <div key={i} className="border-b border-zinc-50 px-4 py-3 last:border-0">
                      <p className="text-sm font-medium text-zinc-900">{n.title}</p>
                      <p className="mt-0.5 text-xs text-zinc-600">{n.message}</p>
                      <p className="mt-1 text-[11px] text-zinc-400">
                        {new Date(n.created_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ))
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
