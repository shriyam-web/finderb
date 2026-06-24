'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  HiOutlineArrowLeftOnRectangle,
  HiOutlineClipboardDocumentList,
  HiOutlineCreditCard,
  HiOutlineSquares2X2,
} from 'react-icons/hi2';
import {
  getAdminAuditLogs,
  getAdminSession,
  logoutAdmin,
  type AdminAuditLogRecord,
} from '@/app/actions/admin';
import { formatDateTimeInr } from '@/lib/formatDateTime';

function actionTone(action: AdminAuditLogRecord['action']) {
  if (action === 'create') return 'bg-sky-100 text-sky-800';
  if (action === 'update') return 'bg-amber-100 text-amber-900';
  return 'bg-rose-100 text-rose-800';
}

function formatMetadata(metadata: Record<string, unknown> | null) {
  if (!metadata || Object.keys(metadata).length === 0) return null;
  try {
    return JSON.stringify(metadata, null, 0);
  } catch {
    return null;
  }
}

export default function AdminAuditLogsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AdminAuditLogRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    const session = await getAdminSession();
    if (!session) {
      router.replace('/admin/login');
      return;
    }

    const result = await getAdminAuditLogs({ page });
    if (!result.success) {
      if (result.error?.includes('controller')) {
        router.replace('/admin/dashboard');
        return;
      }
      setError(result.error || 'Failed to load audit logs');
      setLoading(false);
      return;
    }

    setLogs(result.logs);
    setTotal(result.total);
    setTotalPages(result.totalPages);
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
              <h1 className="text-lg font-bold text-zinc-900">Panel audit log</h1>
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
        <div className="mb-4">
          <p className="text-sm text-zinc-600">
            Who changed what in the admin panel — create, update, and delete actions with timestamps.
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">{total} records · controller access only</p>
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
                  <th className="px-4 py-3 font-semibold">Admin</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Resource</th>
                  <th className="px-4 py-3 font-semibold">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                      Loading audit logs…
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                      No panel changes recorded yet. Audit entries appear when admins perform create,
                      update, or delete actions.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const meta = formatMetadata(log.metadata);
                    return (
                      <tr key={log.id} className="align-top hover:bg-zinc-50/80">
                        <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                          {formatDateTimeInr(log.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-zinc-800">{log.adminEmail}</td>
                        <td className="px-4 py-3 capitalize text-zinc-500">{log.adminRole}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-md px-2 py-0.5 text-xs font-semibold uppercase ${actionTone(log.action)}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-600">
                          <p className="font-medium text-zinc-800">{log.resourceType}</p>
                          {log.resourceId && (
                            <p className="mt-0.5 font-mono text-[11px] text-zinc-400">{log.resourceId}</p>
                          )}
                        </td>
                        <td className="max-w-md px-4 py-3 text-zinc-700">
                          <p>{log.summary}</p>
                          {meta && (
                            <p className="mt-1 truncate font-mono text-[11px] text-zinc-400" title={meta}>
                              {meta}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })
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
