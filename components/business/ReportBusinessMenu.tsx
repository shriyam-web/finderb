'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';

type ReportBusinessMenuProps = {
  businessId: string;
  signedIn: boolean;
  loginHref: string;
  tone?: 'hero' | 'bar';
};

export default function ReportBusinessMenu({
  businessId,
  signedIn,
  loginHref,
  tone = 'hero',
}: ReportBusinessMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!menuOpen && !reportOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setReportOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen, reportOpen]);

  const submit = async () => {
    setError('');
    setSending(true);
    try {
      const response = await fetch('/api/business/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ businessId, reason }),
      });
      const data = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
        unauthorized?: boolean;
      } | null;
      if (!response.ok || !data?.success) {
        setError(data?.error || 'Could not send this report.');
        return;
      }
      setNote('Report sent. FinderB will review it.');
      setReason('');
    } catch {
      setError('Could not send this report.');
    } finally {
      setSending(false);
    }
  };

  const buttonClass =
    tone === 'hero'
      ? 'flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0c0a09] shadow-sm'
      : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-[#0c0a09]';

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setNote('');
          setError('');
          setMenuOpen(true);
        }}
        className={buttonClass}
        aria-label="More"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
      >
        <MoreHorizontal size={tone === 'hero' ? 18 : 16} />
      </button>

      {menuOpen ? (
        <div className="fixed inset-0 z-[80]" onClick={() => setMenuOpen(false)}>
          <div
            role="menu"
            className="absolute right-3 top-[4.75rem] w-56 overflow-hidden rounded-2xl border border-[#e7e5e4] bg-white py-1 shadow-[0_18px_50px_-24px_rgba(28,25,23,0.45)] sm:right-6 sm:top-28"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              role="menuitem"
              className="block w-full px-4 py-3 text-left text-sm font-semibold text-[#0c0a09] hover:bg-[#f6f5f3]"
              onClick={() => {
                setMenuOpen(false);
                setReportOpen(true);
              }}
            >
              Report this business
            </button>
          </div>
        </div>
      ) : null}

      {reportOpen ? (
        <div
          className="fixed inset-0 z-[85] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
          onClick={() => setReportOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-business-title"
            className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="report-business-title" className="text-lg font-semibold text-[#0c0a09]">
              Report this business
            </h2>
            {signedIn ? (
              <>
                <p className="mt-1 text-sm text-stone-500">
                  Tell FinderB what is wrong with this listing.
                </p>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Reason"
                  className="mt-4 w-full rounded-2xl border border-[#e7e5e4] px-3 py-2 text-sm text-[#1c1917] outline-none focus:border-[#1c1917]"
                />
                {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
                {note ? <p className="mt-2 text-sm text-emerald-700">{note}</p> : null}
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReportOpen(false)}
                    className="rounded-full px-4 py-2 text-sm font-semibold text-stone-600"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    disabled={sending || Boolean(note)}
                    onClick={() => void submit()}
                    className="rounded-full bg-[#1c1917] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {sending ? 'Sending…' : 'Send report'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-stone-600">Sign in to report this business.</p>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReportOpen(false)}
                    className="rounded-full px-4 py-2 text-sm font-semibold text-stone-600"
                  >
                    Close
                  </button>
                  <Link
                    href={loginHref}
                    className="rounded-full bg-[#1c1917] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Sign in
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
