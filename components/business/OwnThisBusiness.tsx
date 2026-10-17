'use client';

import { useEffect, useState } from 'react';
import { ownershipRequestDefaults, ownershipRequestPending, requestBusinessOwnership } from '@/app/actions/ownershipRequest';

export default function OwnThisBusiness({ businessId, businessName }: { businessId: string; businessName: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void ownershipRequestPending(businessId).then((state) => {
      if (!cancelled && state.pending) setPending(true);
    });
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  useEffect(() => {
    if (!open) return;
    void ownershipRequestDefaults().then((defaults) => {
      setName((current) => current || defaults.name);
      setEmail((current) => current || defaults.email);
      setPhone((current) => current || defaults.phone);
    });
  }, [open]);

  const submit = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    const result = await requestBusinessOwnership({ businessId, name, email, phone });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setPending(true);
    setMessage(result.alreadyPending ? 'You already have a request waiting for review.' : 'Request sent. FinderB will review it.');
    setOpen(false);
  };

  return (
    <div className="border-t border-stone-200 px-4 py-5">
      <p className="text-sm font-semibold text-zinc-900">Own this business?</p>
      <p className="mt-1 text-xs leading-relaxed text-zinc-500">
        If you run {businessName}, request owner access.
      </p>
      {message ? <p className="mt-2 text-xs text-emerald-700">{message}</p> : null}
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        className="mt-3 rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? 'Request sent' : 'Request access'}
      </button>
      {open ? (
        <form
          className="mt-3 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" inputMode="email" className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
          <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Mobile" inputMode="tel" className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
          {error ? <p className="text-xs text-rose-600">{error}</p> : null}
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
              {busy ? 'Sending…' : 'Submit request'}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600">
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
