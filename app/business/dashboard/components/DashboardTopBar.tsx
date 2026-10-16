'use client';

import { useState } from 'react';
import { HiOutlineBars3, HiOutlineBell } from 'react-icons/hi2';
import { formatDateTimeInr } from '@/lib/formatDateTime';
import {
  broadcastShowsDatetime,
  resolveBroadcastCta,
} from '@/lib/broadcastFields';
import { respondToOwnershipRequest } from '@/app/actions/ownershipRequest';

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
  type?: string;
  ownershipRequestId?: string;
  ownershipDeadline?: string;
  ownershipDecision?: string;
  ownershipCanDecide?: boolean;
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
  businessId?: string;
  onOwnershipAnswered?: () => void;
};

function OwnershipAnswer({
  businessId,
  requestId,
  onAnswered,
}: {
  businessId: string;
  requestId: string;
  onAnswered?: () => void;
}) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const send = async (decision: 'approved' | 'denied') => {
    if (decision === 'denied' && note.trim().length < 3) {
      setError('Write a short reason before denying.');
      return;
    }
    setBusy(true);
    setError('');
    const result = await respondToOwnershipRequest({
      businessId,
      requestId,
      decision,
      note: note.trim(),
    });
    setBusy(false);
    if (!result.success) {
      setError(result.error || 'Could not save your answer.');
      return;
    }
    onAnswered?.();
  };

  return (
    <div className="mt-2 space-y-2" onClick={(event) => event.stopPropagation()}>
      <p className="text-[11px] font-semibold text-amber-700">High priority · answer within 48 hours</p>
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={2}
        placeholder="Reason, required if you deny"
        className="w-full rounded-md border border-zinc-200 px-2 py-1.5 text-xs text-zinc-800 outline-none"
      />
      {error ? <p className="text-[11px] text-rose-600">{error}</p> : null}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void send('approved')}
          className="rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void send('denied')}
          className="rounded-full border border-rose-200 px-3 py-1 text-[11px] font-semibold text-rose-700 disabled:opacity-50"
        >
          Deny
        </button>
      </div>
    </div>
  );
}

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
  businessId,
  onOwnershipAnswered,
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
          <HiOutlineBell size={18} className="text-[#3F3F46]" />
          Alerts
          {unreadCount > 0 && (
            <span className="rounded-full bg-[#f9b864] px-1.5 py-0.5 text-[10px] font-bold text-[#27272A]">
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
                    className="text-[11px] font-semibold text-[#3F3F46] hover:underline"
                  >
                    Mark all as read
                  </button>
                ) : null}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => {
                    const cta = n.ownershipCanDecide ? null : itemCta(n);
                    const answer =
                      n.ownershipCanDecide && businessId && n.ownershipRequestId ? (
                        <OwnershipAnswer
                          businessId={businessId}
                          requestId={n.ownershipRequestId}
                          onAnswered={onOwnershipAnswered}
                        />
                      ) : n.type === 'ownership_request' && n.ownershipDecision ? (
                        <p className="mt-1 text-[11px] font-medium text-zinc-500">
                          {n.ownershipDecision === 'approved'
                            ? 'You approved this request'
                            : n.ownershipDecision === 'denied'
                              ? 'You denied this request'
                              : 'The 48-hour window has closed'}
                        </p>
                      ) : null;
                    return (
                    <div
                      key={n.id || `${n.title}-${n.created_at}`}
                      className={`block w-full border-b border-zinc-50 px-4 py-3 text-left last:border-0 ${n.ownershipCanDecide ? 'bg-amber-50' : n.read === false ? 'bg-[#fff8ee]' : ''}`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (n.ownershipCanDecide) return;
                          onOpenNotification?.(n);
                        }}
                        className="block w-full text-left"
                      >
                        <p className="text-sm font-medium text-zinc-900">{n.title || 'Notification'}</p>
                        <p className="mt-0.5 text-xs text-zinc-600">{n.message}</p>
                      </button>
                      {answer}
                      {cta ? (
                        <button
                          type="button"
                          onClick={() => onOpenNotification?.(n)}
                          className="mt-2 inline-flex rounded-md bg-[#3F3F46] px-2.5 py-1 text-[11px] font-semibold text-white"
                        >
                          {cta.label}
                        </button>
                      ) : null}
                      {broadcastShowsDatetime(n.show_datetime) ? (
                        <p className="mt-1 text-[11px] text-zinc-400">
                          {formatDateTimeInr(n.created_at)}
                        </p>
                      ) : null}
                    </div>
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
