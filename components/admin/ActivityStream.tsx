'use client';

import Link from 'next/link';
import { formatActivityDate, formatActivityTime } from '@/lib/formatDateTime';
import type { AdminActivityEvent } from '@/app/actions/admin';

const ICON_TONES: Record<AdminActivityEvent['type'], string> = {
  user_joined: 'bg-sky-100 text-sky-700',
  partner_joined: 'bg-violet-100 text-violet-700',
  new_lead: 'bg-amber-100 text-amber-800',
  payment_completed: 'bg-emerald-100 text-emerald-800',
};

type ActivityStreamProps = {
  events: AdminActivityEvent[];
  showViewAll?: boolean;
  compact?: boolean;
};

export default function ActivityStream({
  events,
  showViewAll = true,
  compact = false,
}: ActivityStreamProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Activity stream</h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            Latest platform events across users, partners, and leads
          </p>
        </div>
        {showViewAll && (
          <Link
            href="/admin/activity"
            className="shrink-0 text-sm font-medium text-[#215481] hover:underline"
          >
            View all
          </Link>
        )}
      </div>

      {events.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-zinc-500">No recent activity yet.</div>
      ) : (
        <ul className={`divide-y divide-zinc-100 ${compact ? '' : ''}`}>
          {events.map((event) => (
            <li key={event.id} className="flex gap-4 px-5 py-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${ICON_TONES[event.type]}`}
              >
                {event.iconLetter}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-900">{event.title}</p>
                <p className="mt-0.5 truncate text-sm text-zinc-600">{event.subtitle}</p>
              </div>
              <div className="shrink-0 text-right text-xs text-zinc-500">
                <p className="font-medium text-zinc-700">{formatActivityDate(event.occurredAt)}</p>
                <p className="mt-1 tabular-nums">{formatActivityTime(event.occurredAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
