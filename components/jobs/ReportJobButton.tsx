'use client';

import { useState } from 'react';

export default function ReportJobButton({ jobId }: { jobId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setNote('');
    try {
      const res = await fetch('/api/jobs/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, reason }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      setNote(data.success ? 'Report sent. FinderB will review this posting.' : data.error || 'Could not send this report.');
      if (data.success) setReason('');
    } catch {
      setNote('Could not send this report.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3">
      <button type="button" onClick={() => setOpen((value) => !value)} className="text-xs font-semibold text-rose-700">
        Report this job
      </button>
      {open ? (
        <div className="mt-2 space-y-2">
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            placeholder="Why are you reporting this posting?"
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className="rounded-full bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {busy ? 'Sending…' : 'Submit report'}
          </button>
          {note ? <p className="text-xs text-stone-600">{note}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
