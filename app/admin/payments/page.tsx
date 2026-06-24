'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  HiOutlineArrowLeftOnRectangle,
  HiOutlineCreditCard,
  HiOutlineFunnel,
  HiOutlineMagnifyingGlass,
} from 'react-icons/hi2';
import {
  getAdminPaymentStats,
  getAdminPayments,
  getAdminSession,
  logoutAdmin,
  type AdminPaymentRecord,
} from '@/app/actions/admin';
import { formatDateTimeInr } from '@/lib/formatDateTime';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
];

const BILLING_OPTIONS = [
  { value: 'all', label: 'All billing' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'annual', label: 'Annual' },
];

function statusTone(status: string) {
  if (status === 'completed') return 'bg-emerald-100 text-emerald-800';
  if (status === 'pending') return 'bg-amber-100 text-amber-900';
  if (status === 'failed') return 'bg-rose-100 text-rose-800';
  return 'bg-zinc-100 text-zinc-700';
}

function formatDateTime(value: string | null) {
  return formatDateTimeInr(value);
}

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<AdminPaymentRecord[]>([]);
  const [stats, setStats] = useState({
    completed: 0,
    pending: 0,
    failed: 0,
    totalRevenueDisplay: '₹0',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');

  const [status, setStatus] = useState('all');
  const [billingCycle, setBillingCycle] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    const session = await getAdminSession();
    if (!session) {
      router.replace('/admin/login');
      return;
    }

    const [paymentsResult, statsResult] = await Promise.all([
      getAdminPayments({ page, status, billingCycle, search, dateFrom, dateTo }),
      getAdminPaymentStats(),
    ]);

    if (!paymentsResult.success) {
      setError(paymentsResult.error || 'Failed to load payments');
      setLoading(false);
      return;
    }

    setPayments(paymentsResult.payments);
    setTotal(paymentsResult.total);
    setTotalPages(paymentsResult.totalPages);

    if (statsResult.success) {
      setStats(statsResult.stats);
    }

    setLoading(false);
  }, [billingCycle, dateFrom, dateTo, page, router, search, status]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

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
              <h1 className="text-lg font-bold text-zinc-900">Merchant recharges</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Dashboard
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
            { label: 'Completed', value: stats.completed, tone: 'text-emerald-700' },
            { label: 'Pending', value: stats.pending, tone: 'text-amber-700' },
            { label: 'Failed', value: stats.failed, tone: 'text-rose-700' },
            { label: 'Total revenue', value: stats.totalRevenueDisplay, tone: 'text-[#153551]' },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{card.label}</p>
              <p className={`mt-1 text-2xl font-bold tabular-nums ${card.tone}`}>{card.value}</p>
            </div>
          ))}
        </div>

        <section className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <HiOutlineCreditCard className="text-[#215481]" size={20} />
                <h2 className="text-base font-semibold text-zinc-900">Payment records</h2>
              </div>
              <p className="text-sm text-zinc-500">{total} total records</p>
            </div>

            <form onSubmit={handleSearch} className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto_auto]">
              <label className="relative block">
                <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search merchant, email, order ID, payment ID…"
                  className="w-full rounded-lg border border-zinc-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#215481] focus:ring-2 focus:ring-[#215481]/20"
                />
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value);
                }}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={billingCycle}
                onChange={(e) => {
                  setPage(1);
                  setBillingCycle(e.target.value);
                }}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              >
                {BILLING_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setPage(1);
                  setDateFrom(e.target.value);
                }}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setPage(1);
                  setDateTo(e.target.value);
                }}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#153551] px-4 py-2 text-sm font-semibold text-white hover:bg-[#215481] lg:col-span-5 lg:justify-self-start"
              >
                <HiOutlineFunnel size={16} />
                Apply filters
              </button>
            </form>
          </div>

          {error && (
            <div className="border-b border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Merchant</th>
                  <th className="px-4 py-3 font-semibold">Plan</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Order ID</th>
                  <th className="px-4 py-3 font-semibold">Payment ID</th>
                  <th className="px-4 py-3 font-semibold">Valid until</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-zinc-500">
                      Loading payments…
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-zinc-500">
                      No payment records match your filters.
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-zinc-50/80">
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{formatDateTime(payment.createdAt)}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-900">{payment.businessName}</p>
                        <p className="text-xs text-zinc-500">{payment.merchantEmail}</p>
                        {payment.registrationNumber && (
                          <p className="font-mono text-[11px] text-zinc-400">ID {payment.registrationNumber}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-800">{payment.planName}</p>
                        <p className="text-xs capitalize text-zinc-500">{payment.billingCycle}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-zinc-900">{payment.amountDisplay}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${statusTone(payment.status)}`}>
                          {payment.status}
                        </span>
                        {payment.source && (
                          <p className="mt-1 text-[11px] capitalize text-zinc-400">{payment.source}</p>
                        )}
                      </td>
                      <td className="max-w-[140px] truncate px-4 py-3 font-mono text-xs text-zinc-600" title={payment.orderId ?? undefined}>
                        {payment.orderId || '—'}
                      </td>
                      <td className="max-w-[140px] truncate px-4 py-3 font-mono text-xs text-zinc-600" title={payment.paymentId ?? undefined}>
                        {payment.paymentId || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{formatDateTime(payment.planExpiresAt)}</td>
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

        <p className="mt-4 text-center text-xs text-zinc-400">
          <Link href="/" className="hover:text-zinc-600">
            FinderB public site
          </Link>
        </p>
      </main>
    </div>
  );
}
