'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HiOutlineArrowLeftOnRectangle, HiOutlineCreditCard, HiOutlineSquares2X2 } from 'react-icons/hi2';
import {
  getAdminActivityEvents,
  getAdminPaymentStats,
  getAdminSession,
  logoutAdmin,
  type AdminActivityEvent,
} from '@/app/actions/admin';
import ActivityStream from '@/components/admin/ActivityStream';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<AdminActivityEvent[]>([]);
  const [stats, setStats] = useState({
    completed: 0,
    pending: 0,
    failed: 0,
    totalRevenueDisplay: '₹0',
  });
  const [error, setError] = useState('');
  const [isController, setIsController] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    const session = await getAdminSession();
    if (!session) {
      router.replace('/admin/login');
      return;
    }

    const role = String(session.role ?? '').toLowerCase();
    setIsController(role === 'controller' || role === 'controller_admin');

    const [activityResult, statsResult] = await Promise.all([
      getAdminActivityEvents(8),
      getAdminPaymentStats(),
    ]);

    if (!activityResult.success) {
      setError(activityResult.error || 'Failed to load activity');
      setLoading(false);
      return;
    }

    setEvents(activityResult.events);

    if (statsResult.success) {
      setStats(statsResult.stats);
    }

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
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div className="flex items-center gap-4">
            <Image src="/businesslogo.png" alt="FinderB" width={110} height={32} className="h-7 w-auto" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Admin</p>
              <h1 className="text-lg font-bold text-zinc-900">Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/payments"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <HiOutlineCreditCard size={16} />
              Payments
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <HiOutlineArrowLeftOnRectangle size={16} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Completed payments', value: stats.completed, tone: 'text-emerald-700' },
            { label: 'Pending payments', value: stats.pending, tone: 'text-amber-700' },
            { label: 'Failed payments', value: stats.failed, tone: 'text-rose-700' },
            { label: 'Total revenue', value: stats.totalRevenueDisplay, tone: 'text-[#153551]' },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{card.label}</p>
              <p className={`mt-1 text-2xl font-bold tabular-nums ${card.tone}`}>{card.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            {error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {error}
              </div>
            ) : loading ? (
              <div className="rounded-xl border border-zinc-200 bg-white px-5 py-10 text-center text-sm text-zinc-500">
                Loading activity…
              </div>
            ) : (
              <ActivityStream events={events} />
            )}
          </div>

          <aside className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-[#215481]">
              <HiOutlineSquares2X2 size={18} />
              <h2 className="text-sm font-semibold text-zinc-900">Quick links</h2>
            </div>
            <div className="mt-4 space-y-2">
              <Link
                href="/admin/payments"
                className="block rounded-lg border border-zinc-200 px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Merchant recharges
              </Link>
              <Link
                href="/admin/activity"
                className="block rounded-lg border border-zinc-200 px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Full activity log
              </Link>
              <Link
                href="/admin/login-logs"
                className="block rounded-lg border border-zinc-200 px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Login logs
              </Link>
              {isController && (
                <Link
                  href="/admin/audit-logs"
                  className="block rounded-lg border border-zinc-200 px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Panel audit log
                </Link>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
