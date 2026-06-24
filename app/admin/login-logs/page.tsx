'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  HiOutlineArrowLeftOnRectangle,
  HiOutlineCreditCard,
  HiOutlineShieldCheck,
  HiOutlineSquares2X2,
} from 'react-icons/hi2';
import {
  getAdminLoginLogs,
  getAdminSession,
  logoutAdmin,
  type AdminLoginLogRecord,
} from '@/app/actions/admin';
import { formatDateTimeInr } from '@/lib/formatDateTime';

function statusTone(success: boolean) {
  return success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800';
}

export default function AdminLoginLogsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AdminLoginLogRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewAll, setViewAll] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    const session = await getAdminSession();
    if (!session) {
      router.replace('/admin/login');
      return;
    }

    const result = await getAdminLoginLogs({ page });
    if (!result.success) {
      setError(result.error || 'Failed to load login logs');
      setLoading(false);
      return;
    }

    setLogs(result.logs);
    setTotal(result.total);
    setTotalPages(result.totalPages);
    setViewAll(result.viewAll);
    setLoading(false);
  }, [page, router]);

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
              <h1 className="text-lg font-bold text-zinc-900">Login logs</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <HiOutlineSquares2X2 size={16} />
              Dashboard
            </Link>
            <Link
              href="/admin/payments"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <HiOutlineCreditCard size={16} />
              Payments
            </Link>
            <Link
              href="/admin/audit-logs"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Audit log
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-zinc-600">
              {viewAll
                ? 'All admin sign-in attempts (controller access).'
                : 'Your sign-in history only.'}
            </p>
            <p className="mt-0.5 text-xs text-zinc-400">
              {total} records · times shown in IST (UTC+5:30)
            </p>
          </div>
          {viewAll && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#215481]/10 px-3 py-1 text-xs font-semibold text-[#215481]">
              <HiOutlineShieldCheck size={14} />
              Controller admin
            </span>
          )}
        </div>

        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          {error && (
            <div className="border-b border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">When</th>
                  {viewAll && <th className="px-4 py-3 font-semibold">Admin account</th>}
                  <th className="px-4 py-3 font-semibold">Email used</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">IP</th>
                  <th className="px-4 py-3 font-semibold">Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan={viewAll ? 6 : 5} className="px-4 py-10 text-center text-zinc-500">
                      Loading login logs…
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={viewAll ? 6 : 5} className="px-4 py-10 text-center text-zinc-500">
                      No login logs yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-50/80">
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                        {formatDateTimeInr(log.createdAt)}
                      </td>
                      {viewAll && (
                        <td className="px-4 py-3 text-zinc-800">{log.adminEmail || log.email}</td>
                      )}
                      <td className="px-4 py-3 text-zinc-700">{log.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-semibold ${statusTone(log.success)}`}
                        >
                          {log.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-zinc-600">
                        {log.ipAddress || '—'}
                      </td>
                      <td
                        className="max-w-[220px] truncate px-4 py-3 text-xs text-zinc-500"
                        title={log.userAgent ?? undefined}
                      >
                        {log.userAgent || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3">
            <p className="text-sm text-zinc-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
