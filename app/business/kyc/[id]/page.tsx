'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HiOutlineShieldCheck, HiOutlineArrowLeft } from 'react-icons/hi2';
import { getOwnedBusiness } from '@/app/actions/business';
import { submitBusinessKyb } from '@/app/actions/businessKyb';
import { MerchantAuthPage, MerchantAuthMain } from '@/components/business/MerchantAuthShell';

type CheckKind = 'pan' | 'udyam' | 'gstin';

type KybView = {
  kycStatus: string;
  kycMethod: string | null;
  kycLegalName: string | null;
  panMasked: string | null;
  udyamNumber: string | null;
  gstin: string | null;
  gstStatus: string | null;
};

const CHECKS: { id: CheckKind; label: string; hint: string; placeholder: string }[] = [
  { id: 'pan', label: 'PAN', hint: 'Owner or business PAN. A match turns on the tick.', placeholder: 'ABCDE1234F' },
  { id: 'udyam', label: 'Udyam', hint: 'MSME registration. A match turns on the tick.', placeholder: 'UDYAM-UP-43-1234567' },
  { id: 'gstin', label: 'GSTIN', hint: 'Optional. Saving GST does not replace PAN or Udyam.', placeholder: '22AAAAA0000A1Z5' },
];

function verified(status: string | null | undefined) {
  return /^(verified|approved)$/i.test(status || '');
}

export default function KYCPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [record, setRecord] = useState<KybView | null>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<CheckKind>('pan');
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    params.then(async ({ id }) => {
      setBusinessId(id);
      const result = await getOwnedBusiness(id);
      if (result.success && result.business) {
        const business = result.business;
        setBusinessName(business.businessName || business.name || 'Your business');
        setRecord({
          kycStatus: business.kycStatus || 'pending',
          kycMethod: business.kycMethod || null,
          kycLegalName: business.kycLegalName || null,
          panMasked: business.panMasked || null,
          udyamNumber: business.udyamNumber || null,
          gstin: business.gstin || null,
          gstStatus: business.gstStatus || null,
        });
      }
      setLoading(false);
    });
  }, [params]);

  const selected = CHECKS.find((check) => check.id === method) || CHECKS[0];
  const isVerified = verified(record?.kycStatus);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!businessId || submitting) return;
    setSubmitting(true);
    setError('');
    setMessage('');
    const result = await submitBusinessKyb(businessId, method, value);
    setSubmitting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setRecord({
      kycStatus: result.kycStatus,
      kycMethod: result.kycMethod,
      kycLegalName: result.kycLegalName,
      panMasked: result.panMasked,
      udyamNumber: result.udyamNumber,
      gstin: result.gstin,
      gstStatus: result.gstStatus,
    });
    setValue('');
    setMessage(result.message);
  }

  return (
    <MerchantAuthPage>
      <MerchantAuthMain className="max-w-lg">
        <button
          type="button"
          onClick={() => router.push('/business/dashboard')}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[#64748b] hover:text-[#153551]"
        >
          <HiOutlineArrowLeft size={16} />
          Back to dashboard
        </button>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
            <HiOutlineShieldCheck size={24} />
          </div>
          <h1 className="mt-4 text-xl font-bold text-zinc-900">Business verification</h1>
          {businessName && !loading && <p className="mt-1 text-sm text-zinc-500">{businessName}</p>}

          <p className="mt-4 text-sm leading-relaxed text-zinc-700">
            A matching PAN or Udyam registration turns on the FinderB tick. GSTIN can be added now or later.
            Listing approval is still a separate FinderB review.
          </p>

          {record && (
            <dl className="mt-5 space-y-2 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-zinc-500">Status</dt>
                <dd className="font-semibold text-zinc-900">{isVerified ? 'Verified' : record.kycStatus || 'Not started'}</dd>
              </div>
              {record.kycLegalName && (
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">Registered name</dt>
                  <dd className="text-right font-medium text-zinc-900">{record.kycLegalName}</dd>
                </div>
              )}
              {record.panMasked && (
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">PAN</dt>
                  <dd className="font-mono text-zinc-900">{record.panMasked}</dd>
                </div>
              )}
              {record.udyamNumber && (
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">Udyam</dt>
                  <dd className="font-mono text-zinc-900">{record.udyamNumber}</dd>
                </div>
              )}
              {record.gstin && (
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">GSTIN</dt>
                  <dd className="text-right font-mono text-zinc-900">
                    {record.gstin}
                    {record.gstStatus ? ` · ${record.gstStatus}` : ''}
                  </dd>
                </div>
              )}
            </dl>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {CHECKS.map((check) => (
                <button
                  key={check.id}
                  type="button"
                  onClick={() => {
                    setMethod(check.id);
                    setError('');
                  }}
                  className={`rounded-xl border px-2 py-2 text-sm font-semibold ${
                    method === check.id
                      ? 'border-[#215481] bg-[#215481] text-white'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  {check.label}
                </button>
              ))}
            </div>
            <label className="block text-sm">
              <span className="font-medium text-zinc-800">{selected.label}</span>
              <span className="mt-0.5 block text-zinc-500">{selected.hint}</span>
              <input
                value={value}
                onChange={(event) => setValue(event.target.value.toUpperCase())}
                placeholder={selected.placeholder}
                autoComplete="off"
                spellCheck={false}
                className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2.5 font-mono text-sm uppercase tracking-wide text-zinc-900 outline-none focus:border-[#215481]"
              />
            </label>
            {error && <p className="text-sm text-red-700">{error}</p>}
            {message && <p className="text-sm text-emerald-800">{message}</p>}
            <button
              type="submit"
              disabled={submitting || !value.trim() || !businessId}
              className="inline-flex w-full items-center justify-center rounded-xl bg-[#215481] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#153551] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Checking…' : method === 'gstin' ? 'Save GSTIN' : 'Verify and turn on the tick'}
            </button>
          </form>

          <div className="mt-6">
            <Link href="/business/dashboard" className="text-sm font-semibold text-[#215481] hover:text-[#153551]">
              Return to dashboard
            </Link>
          </div>
        </div>
      </MerchantAuthMain>
    </MerchantAuthPage>
  );
}
