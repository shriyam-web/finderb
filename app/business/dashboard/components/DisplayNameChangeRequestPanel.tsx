'use client';

import { useEffect, useState } from 'react';
import { HiOutlineUser } from 'react-icons/hi2';
import {
  getPendingChangeRequest,
  submitChangeRequest,
} from '@/app/actions/businessChangeRequests';
import { DISPLAY_NAME_FIELD, type BusinessChangeRequest } from '@/lib/businessChangeRequest';
import { dashboard } from './dashboard-ui';

type DisplayNameChangeRequestPanelProps = {
  businessId: string;
  currentDisplayName: string;
  onPendingChange?: (request: BusinessChangeRequest | null) => void;
};

export default function DisplayNameChangeRequestPanel({
  businessId,
  currentDisplayName,
  onPendingChange,
}: DisplayNameChangeRequestPanelProps) {
  const [loadingPending, setLoadingPending] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<BusinessChangeRequest | null>(null);
  const [requestedName, setRequestedName] = useState('');
  const [merchantNote, setMerchantNote] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;

    getPendingChangeRequest(businessId, DISPLAY_NAME_FIELD).then((result) => {
      if (cancelled || !result.success) {
        setLoadingPending(false);
        return;
      }
      setPendingRequest(result.request);
      onPendingChange?.(result.request);
      setLoadingPending(false);
    });

    return () => {
      cancelled = true;
    };
  }, [businessId, onPendingChange]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const trimmed = requestedName.trim();
    if (!trimmed) {
      setError('Enter the new display name.');
      return;
    }

    if (trimmed.toLowerCase() === currentDisplayName.trim().toLowerCase()) {
      setError('Choose a name that is different from your current display name.');
      return;
    }

    setSubmitting(true);
    const result = await submitChangeRequest({
      businessId,
      field: DISPLAY_NAME_FIELD,
      requestedValue: trimmed,
      merchantNote,
    });
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setPendingRequest(result.request);
    onPendingChange?.(result.request);
    setRequestedName('');
    setMerchantNote('');
    setSuccess('Your display name change request was submitted. We will review it shortly.');
  };

  if (loadingPending) {
    return (
      <div className={`${dashboard.emptyState} py-10`}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#215481] border-t-transparent" />
        <p className="mt-3 text-sm text-zinc-500">Loading display name settings…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Current display name
        </p>
        <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#153551]">
          <HiOutlineUser size={16} className="shrink-0 text-zinc-400" />
          {currentDisplayName || 'Not set'}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          This is the name customers see on FinderB. Submit a change request and our team will review it
          before it goes live.
        </p>
      </div>

      {pendingRequest ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
          <p className="font-semibold">Change request pending review</p>
          <p className="mt-1 text-xs leading-relaxed">
            Requested: <span className="font-medium">{pendingRequest.requested_value}</span>
          </p>
          <p className="mt-1 text-xs text-amber-800/90">
            Submitted {new Date(pendingRequest.created_at).toLocaleString()}. You can submit a new request
            after this one is reviewed.
          </p>
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="requested-display-name" className="mb-1 block text-xs font-medium text-zinc-600">
              Request new display name
            </label>
            <input
              id="requested-display-name"
              type="text"
              value={requestedName}
              onChange={(e) => setRequestedName(e.target.value)}
              placeholder="e.g. Sharma Electronics"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#215481] focus:ring-2 focus:ring-[#215481]/10"
            />
          </div>

          <div>
            <label htmlFor="display-name-change-note" className="mb-1 block text-xs font-medium text-zinc-600">
              Why do you need this change? (optional)
            </label>
            <textarea
              id="display-name-change-note"
              value={merchantNote}
              onChange={(e) => setMerchantNote(e.target.value)}
              rows={3}
              placeholder="e.g. Customers know us by this name…"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#215481] focus:ring-2 focus:ring-[#215481]/10"
            />
          </div>

          {error && <p className="text-xs text-rose-600">{error}</p>}
          {success && <p className="text-xs text-emerald-700">{success}</p>}

          <button
            type="submit"
            disabled={submitting || !requestedName.trim()}
            className={`w-full ${dashboard.btnPrimary} disabled:opacity-50`}
          >
            {submitting ? 'Submitting…' : 'Submit change request'}
          </button>
        </>
      )}
    </form>
  );
}
