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
    <div className="relative h-full overflow-hidden rounded-2xl border border-teal-300/70 bg-gradient-to-br from-[#D9F6F0] via-[#7EDFD0] to-[#2DD4BF] px-4 py-3 text-teal-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
      <div className="pointer-events-none absolute -left-8 top-[-28px] h-28 w-28 rounded-full bg-white/35" />
      <div className="pointer-events-none absolute -bottom-10 right-[-12px] h-32 w-32 rounded-[2rem] bg-emerald-200/50" />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <HiOutlineRocketLaunch size={20} className="mt-0.5 shrink-0 text-teal-800" />
          <div className="min-w-0">
            <p className="text-sm font-bold">Get more customers with a FinderB plan</p>
            <p className="mt-0.5 text-xs leading-relaxed text-teal-950/80">
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
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-800 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
          />
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-800/20 bg-white/50 px-4 py-2 text-sm font-semibold hover:bg-white/80"
          >
            <HiOutlineCreditCard size={16} />
            Compare plans
          </Link>
        </div>
      </div>
    </div>
  );
}
