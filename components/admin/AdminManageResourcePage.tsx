'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  HiOutlineArrowLeftOnRectangle,
  HiOutlineCreditCard,
  HiOutlineMagnifyingGlass,
  HiOutlineSquares2X2,
  HiOutlineTrash,
} from 'react-icons/hi2';
import {
  adminDeleteResource,
  adminListResource,
  getAdminPermissions,
} from '@/app/actions/adminManage';
import { getAdminSession, logoutAdmin } from '@/app/actions/admin';
import { ADMIN_RESOURCE_LIST } from '@/lib/admin/resources';
import { formatDateTimeInr } from '@/lib/formatDateTime';

type ManagePageProps = {
  resourceKey: string;
};

function formatCell(value: unknown) {
  if (value == null || value === '') return '—';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return formatDateTimeInr(value);
  }
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default function AdminManageResourcePage({ resourceKey }: ManagePageProps) {
  const router = useRouter();
  const resourceMeta = useMemo(
    () => ADMIN_RESOURCE_LIST.find((resource) => resource.key === resourceKey) ?? null,
    [resourceKey]
  );

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [allowedResources, setAllowedResources] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    if (!resourceMeta) return;

    setLoading(true);
    setError('');

    const session = await getAdminSession();
    if (!session) {
      router.replace('/admin/login');
      return;
    }

    const permissions = await getAdminPermissions();
    if (permissions.success) {
      const tabs = permissions.allowedTabs.length
        ? permissions.allowedTabs
        : ADMIN_RESOURCE_LIST.map((resource) => resource.key);
      setAllowedResources(tabs);
      if (permissions.allowedTabs.length && !permissions.allowedTabs.includes(resourceKey)) {
        router.replace('/admin/manage');
        return;
      }
    }

    const result = await adminListResource(resourceKey, { page, search });
    if (!result.success) {
      setError(result.error || 'Failed to load records');
      setLoading(false);
      return;
    }

    setRows(result.rows);
    setTotal(result.total);
    setTotalPages(result.totalPages);
    setLoading(false);
  }, [page, resourceKey, resourceMeta, router, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string, label: string) => {
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;

    setDeletingId(id);
    const result = await adminDeleteResource(resourceKey, id);
    setDeletingId(null);

    if (!result.success) {
      setError(result.error || 'Delete failed');
      return;
    }

    await loadData();
  };

  const handleLogout = async () => {
    await logoutAdmin();
    router.push('/admin/login');
  };

  if (!resourceMeta) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
        Unknown resource.
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div className="flex items-center gap-4">
            <Image src="/businesslogo.png" alt="FinderB" width={110} height={32} className="h-7 w-auto" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Admin</p>
              <h1 className="text-lg font-bold text-zinc-900">{resourceMeta.label}</h1>
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/admin/manage" className="text-sm font-medium text-[#215481] hover:underline">
              ← All resources
            </Link>
            <p className="mt-1 text-sm text-zinc-600">
              Manage {resourceMeta.label.toLowerCase()}. Deletes are recorded in the panel audit log.
            </p>
          </div>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setPage(1);
              setSearch(searchInput.trim());
            }}
          >
            <div className="relative">
              <HiOutlineMagnifyingGlass
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={`Search ${resourceMeta.label.toLowerCase()}…`}
                className="w-64 rounded-lg border border-zinc-200 py-2 pl-9 pr-3 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-[#215481] px-3 py-2 text-sm font-medium text-white hover:bg-[#1a4368]"
            >
              Search
            </button>
          </form>
        </div>

        {allowedResources.length > 1 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {ADMIN_RESOURCE_LIST.filter((resource) => allowedResources.includes(resource.key)).map(
              (resource) => (
                <Link
                  key={resource.key}
                  href={`/admin/manage/${resource.key}`}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    resource.key === resourceKey
                      ? 'bg-[#215481] text-white'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  {resource.label}
                </Link>
              )
            )}
          </div>
        )}

        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          {error && (
            <div className="border-b border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  {resourceMeta.listColumns.map((column) => (
                    <th key={column.key} className="px-4 py-3 font-semibold">
                      {column.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan={resourceMeta.listColumns.length + 1} className="px-4 py-10 text-center text-zinc-500">
                      Loading…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={resourceMeta.listColumns.length + 1} className="px-4 py-10 text-center text-zinc-500">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const id = String(row.id);
                    const label = String(row[resourceMeta.titleField] ?? id);
                    return (
                      <tr key={id} className="hover:bg-zinc-50/80">
                        {resourceMeta.listColumns.map((column) => (
                          <td key={column.key} className="px-4 py-3 text-zinc-700">
                            {formatCell(row[column.key])}
                          </td>
                        ))}
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            disabled={deletingId === id}
                            onClick={() => handleDelete(id, label)}
                            className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                          >
                            <HiOutlineTrash size={14} />
                            Delete
                          </button>
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
              {total} records · page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((current) => current + 1)}
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
