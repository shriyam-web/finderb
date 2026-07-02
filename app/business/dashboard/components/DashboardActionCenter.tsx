'use client';

import {
  HiOutlineArrowRight,
  HiOutlineCreditCard,
  HiOutlineShieldCheck,
} from 'react-icons/hi2';
import { getPaidPlansLabel } from '@/lib/subscription/merchantSubscription';
import MerchantRechargeButton from '@/components/business/MerchantRechargeButton';
import { KycStatusBadge, PaymentStatusBadge } from './StatusBadge';

type DashboardActionCenterProps = {
  businessId?: string;
  businessName: string;
  fullName?: string;
  email?: string;
  mobile?: string;
  paymentStatus?: string;
  kycStatus?: string;
  paymentError?: string | null;
  onPaymentError: (msg: string) => void;
  onOpenKyc: () => void;
};

export default function DashboardActionCenter({
  businessId,
  businessName,
  fullName,
  email,
  mobile,
  paymentStatus,
  kycStatus,
  paymentError,
  onPaymentError,
  onOpenKyc,
}: DashboardActionCenterProps) {
  const isPaymentDue = paymentStatus !== 'completed';
  const kycNormalized = (kycStatus || 'pending').toLowerCase();
  const isKycDone = kycNormalized === 'approved' || kycNormalized === 'verified';

  if (!isPaymentDue && isKycDone) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-amber-200/80 bg-white shadow-[0_8px_30px_-12px_rgba(245,158,11,0.2)]">
      <div className="bg-gradient-to-r from-amber-500 via-[#f9b864] to-orange-400 px-5 py-3.5 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#153551]/70">Action needed</p>
            <h2 className="text-base font-bold text-[#153551]">Unlock your full partner access</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {isPaymentDue && <PaymentStatusBadge status={paymentStatus} size="sm" />}
            {!isKycDone && <KycStatusBadge status={kycStatus} size="sm" />}
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-100 md:grid md:grid-cols-2 md:divide-x md:divide-y-0">
        {isPaymentDue && (
          <div className="relative bg-gradient-to-br from-orange-50 to-amber-50/30 p-5 md:p-6">
            <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-orange-400 to-amber-500" aria-hidden />
            <div className="flex gap-4 pl-2">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25">
                <HiOutlineCreditCard size={22} />
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <h3 className="font-bold text-slate-900">Upgrade your plan</h3>
                  <p className="mt-1 text-sm text-slate-700">
                    Enquiries are waiting — activate {getPaidPlansLabel()} to see phone numbers and email.
                  </p>
                </div>
                {paymentError && (
                  <p className="rounded-lg bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-900 ring-1 ring-rose-200">
                    {paymentError}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  {businessId && (
                    <MerchantRechargeButton
                      businessId={businessId}
                      businessName={businessName}
                      fullName={fullName}
                      email={email}
                      mobile={mobile}
                      label="Choose plan"
                      onError={onPaymentError}
                      className="inline-flex items-center rounded-xl bg-gradient-to-r from-[#153551] to-[#215481] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:brightness-110 disabled:opacity-60"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!isKycDone && (
          <div className="relative bg-gradient-to-br from-violet-50 to-sky-50/40 p-5 md:p-6">
            <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-violet-500 to-sky-500" aria-hidden />
            <div className="flex gap-4 pl-2">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25">
                <HiOutlineShieldCheck size={22} />
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <h3 className="font-bold text-slate-900">Identity verification (KYC)</h3>
                  <p className="mt-1 text-sm text-slate-700">
                    KYC is handled by FinderB&apos;s verification partner — not in this dashboard.
                    Listing approval and KYC are separate; approving your listing does not complete KYC.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenKyc}
                  className="inline-flex items-center gap-1 rounded-xl border border-violet-200 bg-white px-5 py-2.5 text-sm font-bold text-violet-900 hover:bg-violet-50"
                >
                  Learn more
                  <HiOutlineArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
