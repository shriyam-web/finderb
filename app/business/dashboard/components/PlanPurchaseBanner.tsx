'use client';

import Link from 'next/link';
import { HiOutlineCreditCard, HiOutlineRocketLaunch } from 'react-icons/hi2';
import MerchantRechargeButton from '@/components/business/MerchantRechargeButton';
import { getPaidPlansLabel } from '@/lib/subscription/merchantSubscription';

type PlanPurchaseBannerProps = {
  businessId: string;
  businessName: string;
  fullName?: string;
  email?: string;
  mobile?: string;
};

export default function PlanPurchaseBanner({
  businessId,
  businessName,
  fullName,
  email,
  mobile,
}: PlanPurchaseBannerProps) {
  return (
    <div className="h-full rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sky-950">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <HiOutlineRocketLaunch size={20} className="mt-0.5 shrink-0 text-sky-700" />
          <div className="min-w-0">
            <p className="text-sm font-bold">Get more customers with a FinderB plan</p>
            <p className="mt-0.5 text-xs leading-relaxed text-sky-900/90">
              You are on the free Starter plan. Upgrade to {getPaidPlansLabel()} to see who enquired and call
              them back.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <MerchantRechargeButton
            businessId={businessId}
            businessName={businessName}
            fullName={fullName}
            email={email}
            mobile={mobile}
            label="Choose plan"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#153551] px-4 py-2 text-sm font-semibold text-white hover:bg-[#215481]"
          />
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-300 px-4 py-2 text-sm font-semibold hover:bg-white/60"
          >
            <HiOutlineCreditCard size={16} />
            Compare plans
          </Link>
        </div>
      </div>
    </div>
  );
}
