'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HiOutlineArrowLeft, HiOutlineArrowLeftOnRectangle } from 'react-icons/hi2';
import {
  getAdminActivityEvents,
  getAdminSession,
  logoutAdmin,
  type AdminActivityEvent,
} from '@/app/actions/admin';
import ActivityStream from '@/components/admin/ActivityStream';

export default function AdminActivityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<AdminActivityEvent[]>([]);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    const session = await getAdminSession();
    if (!session) {
      router.replace('/admin/login');
      return;
    }

    const activityResult = await getAdminActivityEvents(50);
    if (!activityResult.success) {
      setError(activityResult.error || 'Failed to load activity');
      setLoading(false);
      return;
    }

    setEvents(activityResult.events);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = async () => {
    await logoutAdmin();
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div className="flex items-center gap-4">
            <Image src="/businesslogo.png" alt="FinderB" width={110} height={32} className="h-7 w-auto" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Admin</p>
              <h1 className="text-lg font-bold text-zinc-900">Activity log</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <HiOutlineArrowLeftOnRectangle size={16} />
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 md:px-8">
        <Link
          href="/admin/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#215481] hover:underline"
        >
          <HiOutlineArrowLeft size={16} />
          Back to dashboard
        </Link>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        ) : loading ? (
          <div className="rounded-xl border border-zinc-200 bg-white px-5 py-10 text-center text-sm text-zinc-500">
            Loading activity…
          </div>
        ) : (
          <ActivityStream events={events} showViewAll={false} />
        )}
      </main>
    </div>
  );
}
