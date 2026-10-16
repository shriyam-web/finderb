'use client';

import { useEffect, useState } from 'react';
import {
  getApplicationFile,
  getJobApplications,
  markApplicationShortlisted,
} from '@/app/actions/jobBoard';

type ApplicationRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  message: string | null;
  cv_name: string | null;
  cv_kind: string | null;
  status: string;
  created_at: string;
};

export default function JobApplicationsPanel({
  businessId,
  jobId,
  canEdit,
}: {
  businessId: string;
  jobId: string;
  canEdit: boolean;
}) {
  const [rows, setRows] = useState<ApplicationRow[] | null>(null);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    void getJobApplications(businessId, jobId).then((result) => {
      if (!live) return;
      if (!result.success) {
        setError(result.error || 'Could not load applications.');
        setRows([]);
        return;
      }
      setRows(result.applications);
    });
    return () => {
      live = false;
    };
  }, [businessId, jobId]);

  const open = rows?.find((row) => row.id === openId) || null;

  const shortlist = async (row: ApplicationRow) => {
    setBusy(true);
    const result = await markApplicationShortlisted(businessId, row.id);
    setBusy(false);
    if (!result.success) {
      setError(result.error || 'Could not shortlist this candidate.');
      return;
    }
    setRows((current) => current?.map((item) => (item.id === row.id ? { ...item, status: 'shortlisted' } : item)) || current);
  };

  const openCv = async (row: ApplicationRow) => {
    setBusy(true);
    const result = await getApplicationFile(businessId, row.id);
    setBusy(false);
    if (!result.success || !('url' in result)) {
      setError('error' in result ? result.error || 'Could not open this CV.' : 'Could not open this CV.');
      return;
    }
    setFileUrl(result.url);
    if (result.kind !== 'pdf') window.open(result.url, '_blank', 'noopener,noreferrer');
  };

  if (!rows) return <p className="px-5 pb-4 text-sm text-zinc-500">Loading applications…</p>;
  if (!rows.length) return <p className="px-5 pb-4 text-sm text-zinc-500">No applications yet.</p>;

  return (
    <div className="border-t border-zinc-100 px-5 py-4">
      {error ? <p className="mb-2 text-sm text-rose-700">{error}</p> : null}
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              onClick={() => {
                setOpenId(row.id === openId ? '' : row.id);
                setFileUrl('');
              }}
              className="flex w-full items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-left"
            >
              <span>
                <span className="block text-sm font-semibold text-zinc-900">{row.full_name}</span>
                <span className="block text-xs text-zinc-500">{row.phone}</span>
              </span>
              <span className="text-[11px] font-semibold uppercase text-zinc-500">
                {row.status === 'shortlisted' ? 'Shortlisted' : 'Received'}
              </span>
            </button>
            {open?.id === row.id ? (
              <div className="mt-2 space-y-2 rounded-lg bg-zinc-50 px-3 py-3 text-sm text-zinc-700">
                <p>{row.email}</p>
                {row.message ? <p className="whitespace-pre-wrap">{row.message}</p> : null}
                {row.cv_name ? (
                  <div className="space-y-2">
                    <button type="button" disabled={busy} onClick={() => void openCv(row)} className="text-sm font-semibold text-zinc-900">
                      {row.cv_name}
                    </button>
                    {fileUrl && row.cv_kind === 'pdf' ? (
                      <iframe title={row.cv_name} src={fileUrl} className="h-96 w-full rounded-md border border-zinc-200 bg-white" />
                    ) : null}
                    {fileUrl ? (
                      <a href={fileUrl} target="_blank" rel="noreferrer" className="block text-xs font-semibold text-zinc-700">
                        Download
                      </a>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">No CV attached.</p>
                )}
                {canEdit && row.status !== 'shortlisted' ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void shortlist(row)}
                    className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Shortlist
                  </button>
                ) : null}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
