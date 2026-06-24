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
import { getAdminPermissions } from '@/app/actions/adminManage';
import { getAdminSession, logoutAdmin } from '@/app/actions/admin';
import { ADMIN_RESOURCE_LIST } from '@/lib/admin/resources';

export default function AdminManageHubPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isController, setIsController] = useState(false);
  const [allowedResources, setAllowedResources] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);

    const session = await getAdminSession();
    if (!session) {
      router.replace('/admin/login');
      return;
    }

    const permissions = await getAdminPermissions();
    if (!permissions.success) {
      router.replace('/admin/login');
      return;
    }

    setIsController(permissions.isController);
    const tabs = permissions.allowedTabs.length
      ? permissions.allowedTabs
      : ADMIN_RESOURCE_LIST.map((resource) => resource.key);
    setAllowedResources(tabs);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = async () => {
    await logoutAdmin();
    router.push('/admin/login');
  };

  const visibleResources = ADMIN_RESOURCE_LIST.filter((resource) =>
    allowedResources.includes(resource.key)
  );

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div className="flex items-center gap-4">
            <Image src="/businesslogo.png" alt="FinderB" width={110} height={32} className="h-7 w-auto" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Admin</p>
              <h1 className="text-lg font-bold text-zinc-900">Content management</h1>
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
            {isController && (
              <Link
                href="/admin/audit-logs"
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                <HiOutlineClipboardDocumentList size={16} />
                Audit log
              </Link>
            )}
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
        <p className="text-sm text-zinc-600">
          Create, update, and delete platform content. All changes are logged with timestamps in IST.
        </p>

        {loading ? (
          <div className="mt-6 rounded-xl border border-zinc-200 bg-white px-5 py-10 text-center text-sm text-zinc-500">
            Loading resources…
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleResources.map((resource) => (
              <Link
                key={resource.key}
                href={`/admin/manage/${resource.key}`}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-[#215481]/30 hover:shadow-md"
              >
                <h2 className="text-base font-semibold text-zinc-900">{resource.label}</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  View, search, and delete {resource.label.toLowerCase()}.
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
