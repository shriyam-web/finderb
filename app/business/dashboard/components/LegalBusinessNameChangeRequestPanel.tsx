'use client';

import { useEffect, useState } from 'react';
import { HiOutlineBriefcase } from 'react-icons/hi2';
import {
  getPendingChangeRequest,
  submitChangeRequest,
} from '@/app/actions/businessChangeRequests';
import { LEGAL_BUSINESS_NAME_FIELD, type BusinessChangeRequest } from '@/lib/businessChangeRequest';
import { dashboard } from './dashboard-ui';

type LegalBusinessNameChangeRequestPanelProps = {
  businessId: string;
  currentLegalName: string;
  onPendingChange?: (request: BusinessChangeRequest | null) => void;
};

export default function LegalBusinessNameChangeRequestPanel({
  businessId,
  currentLegalName,
  onPendingChange,
}: LegalBusinessNameChangeRequestPanelProps) {
  const [loadingPending, setLoadingPending] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<BusinessChangeRequest | null>(null);
  const [requestedName, setRequestedName] = useState('');
  const [merchantNote, setMerchantNote] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;

    getPendingChangeRequest(businessId, LEGAL_BUSINESS_NAME_FIELD).then((result) => {
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
      setError('Enter the new legal business name.');
      return;
    }

    if (trimmed.toLowerCase() === currentLegalName.trim().toLowerCase()) {
      setError('Choose a name that is different from your current legal business name.');
      return;
    }

    setSubmitting(true);
    const result = await submitChangeRequest({
      businessId,
      field: LEGAL_BUSINESS_NAME_FIELD,
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
    setSuccess('Your legal name change request was submitted. We will review it shortly.');
  };

  if (loadingPending) {
    return (
      <div className={`${dashboard.emptyState} py-10`}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#215481] border-t-transparent" />
        <p className="mt-3 text-sm text-zinc-500">Loading legal name settings…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Current legal business name
        </p>
        <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#153551]">
          <HiOutlineBriefcase size={16} className="shrink-0 text-zinc-400" />
          {currentLegalName || 'Not set'}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          Your registered legal name cannot be edited directly. Submit a change request and our team will
          verify it before updating your records.
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
            <label htmlFor="requested-legal-name" className="mb-1 block text-xs font-medium text-zinc-600">
              Request new legal business name
            </label>
            <input
              id="requested-legal-name"
              type="text"
              value={requestedName}
              onChange={(e) => setRequestedName(e.target.value)}
              placeholder="As on GST / registration certificate"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#215481] focus:ring-2 focus:ring-[#215481]/10"
            />
          </div>

          <div>
            <label htmlFor="legal-name-change-note" className="mb-1 block text-xs font-medium text-zinc-600">
              Why do you need this change? (optional)
            </label>
            <textarea
              id="legal-name-change-note"
              value={merchantNote}
              onChange={(e) => setMerchantNote(e.target.value)}
              rows={3}
              placeholder="e.g. Business was rebranded after registration…"
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
