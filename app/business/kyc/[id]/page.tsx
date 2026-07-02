'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HiOutlineShieldCheck, HiOutlineArrowLeft } from 'react-icons/hi2';
import { getOwnedBusiness } from '@/app/actions/business';
import { KYC_OUTSOURCED_MESSAGE } from '@/lib/businessVerification';
import { MerchantAuthPage, MerchantAuthMain } from '@/components/business/MerchantAuthShell';

export default function KYCPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(async ({ id }) => {
      setBusinessId(id);
      const result = await getOwnedBusiness(id);
      if (result.success && result.business) {
        setBusinessName(result.business.businessName || result.business.name || 'Your business');
      }
      setLoading(false);
    });
  }, [params]);

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
          <h1 className="mt-4 text-xl font-bold text-zinc-900">Business verification (KYC)</h1>
          {businessName && !loading && (
            <p className="mt-1 text-sm text-zinc-500">{businessName}</p>
          )}

          <p className="mt-4 text-sm leading-relaxed text-zinc-700">{KYC_OUTSOURCED_MESSAGE}</p>

          <ul className="mt-5 space-y-3 text-sm text-zinc-600">
            <li className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2.5">
              <span className="font-semibold text-zinc-900">Listing approval</span> — FinderB reviews
              your public listing before it appears in search. This is separate from KYC.
            </li>
            <li className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2.5">
              <span className="font-semibold text-zinc-900">Identity verification (KYC)</span> — handled
              by our verification partner when required. You do not upload PAN/GST/MSME here.
            </li>
          </ul>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/business/dashboard"
              className="inline-flex items-center justify-center rounded-xl bg-[#215481] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#153551]"
            >
              Return to dashboard
            </Link>
            <a
              href="mailto:support@finderb.in?subject=Business%20KYC%20question"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Contact support
            </a>
          </div>
        </div>
      </MerchantAuthMain>
    </MerchantAuthPage>
  );
}
