'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import PricingHero from '@/components/pricing/PricingHero';
import PricingPlansSection from '@/components/pricing/PricingPlansSection';
import { MerchantAuthMain } from '@/components/business/MerchantAuthShell';
import {
  formatInr,
  GROWTH_PRO_EFFECTIVE_MONTHLY_ANNUAL,
  GROWTH_PRO_OFFER_MONTHLY,
} from '@/lib/pricing/growthPro';
import { getBusinessSession } from '@/app/actions/business';
import { getMerchantSubscriptionStatus } from '@/lib/subscription/merchantSubscription';

function merchantPaymentUrl(businessId: string, billing: 'monthly' | 'annual') {
  return `/business/payment/${encodeURIComponent(businessId)}?billing=${billing}&checkout=1`;
}

function PricingPageContent() {
  const searchParams = useSearchParams();
  const businessId = searchParams.get('businessId');
  const isRechargeFlow = Boolean(businessId);
  const [loadingPlan, setLoadingPlan] = useState<'monthly' | 'annual' | null>(null);
  const [hideStarter, setHideStarter] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getBusinessSession().then((result) => {
      if (cancelled || !result?.success || !result.business) return;
      const business = result.business as {
        selectedPlan?: string | null;
        paymentStatus?: string | null;
        billingCycle?: string | null;
        planStartedAt?: string | null;
        planExpiresAt?: string | null;
        updatedAt?: string | null;
        createdAt?: string | null;
        autoRenewEnabled?: boolean | null;
        mandateStatus?: string | null;
        subscriptionStatus?: string | null;
        razorpaySubscriptionId?: string | null;
      };
      const subscription = getMerchantSubscriptionStatus(business);
      if (!subscription.isActive) setHideStarter(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePayment = (plan: 'monthly' | 'annual') => {
    setLoadingPlan(plan);
    setTimeout(() => {
      setLoadingPlan(null);
      if (businessId) {
        window.location.href = merchantPaymentUrl(businessId, plan);
        return;
      }
      window.location.href = `/business/register?plan=pro&billing=${plan}`;
    }, 1000);
  };

  return (
    <div className="pricing-page min-h-screen">
      {loadingPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#faf8f5]/95 backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#f9b864] border-t-[#153551]" />
        </div>
      )}

      {isRechargeFlow && (
        <div className="border-b border-[#e8dfd4]/80 bg-[#fff9ed]">
          <MerchantAuthMain className="py-3">
            <p className="text-center text-sm font-semibold text-[#153551]">
              Choose a plan to activate Pro and unlock lead contacts.
            </p>
          </MerchantAuthMain>
        </div>
      )}

      <PricingHero alreadyOnStarter={hideStarter} />

      <PricingPlansSection
        mode="pricing"
        loadingPlan={loadingPlan}
        onChoosePro={handlePayment}
        hideStarter={hideStarter}
      />

      {/* Closing CTA */}
      <section className="pricing-close-cta py-16 sm:py-20">
        <MerchantAuthMain className="text-center">
          <h2 className="pricing-section-title text-2xl font-bold tracking-[-0.02em] text-white sm:text-4xl">
            Ready to grow?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/75 sm:text-base">
            {hideStarter
              ? 'You are on Starter. Upgrade when you want leads at '
              : 'Start free today — upgrade when you want leads at '}
            <span className="font-bold text-[#f9b864]">{formatInr(GROWTH_PRO_OFFER_MONTHLY)}/mo</span> or{' '}
            <span className="font-bold text-[#f9b864]">{formatInr(GROWTH_PRO_EFFECTIVE_MONTHLY_ANNUAL)}/mo</span>{' '}
            annual.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => handlePayment('annual')}
              disabled={loadingPlan !== null}
              className="register-hero-cta-btn inline-flex items-center gap-2 px-8 py-4 text-sm font-bold text-[#153551] disabled:opacity-60"
            >
              {hideStarter ? 'Upgrade to Pro' : 'Claim annual plan'}
              <ArrowRight size={16} strokeWidth={2.5} />
            </button>
            {hideStarter ? (
              <button
                type="button"
                onClick={() => handlePayment('monthly')}
                disabled={loadingPlan !== null}
                className="inline-flex items-center justify-center rounded-xl border-2 border-white/25 px-8 py-4 text-sm font-bold text-white hover:bg-white/10 disabled:opacity-60"
              >
                Upgrade to Growth
              </button>
            ) : (
              <Link
                href="/business/register"
                className="inline-flex items-center justify-center rounded-xl border-2 border-white/25 px-8 py-4 text-sm font-bold text-white hover:bg-white/10"
              >
                List free first
              </Link>
            )}
          </div>
        </MerchantAuthMain>
      </section>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#f9b864] border-t-[#153551]" />
        </div>
      }
    >
      <PricingPageContent />
    </Suspense>
  );
}
