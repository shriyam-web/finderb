'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  HelpCircle,
  Smartphone,
  Star,
  Users,
  type LucideIcon,
} from 'lucide-react';
import IndianPhoneInput from '@/components/IndianPhoneInput';
import {
  MerchantAuthMain,
  merchantAuthBtnPrimary,
} from '@/components/business/MerchantAuthShell';
import RegisterHero from '@/components/business/RegisterHero';
import PricingFontRoot from '@/components/pricing/PricingFontRoot';
import PricingPlansSection from '@/components/pricing/PricingPlansSection';

type Stat = { label: string; value: string };
type Story = {
  name: string;
  business: string;
  role: string;
  testimonial: string;
  duration: string;
  image: string;
};
type Step = { step: number; title: string; desc: string; icon: LucideIcon };
type Faq = { q: string; a: string };

function MobileRegisterInput({
  mobile,
  onChange,
  onSubmit,
  error,
}: {
  mobile: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
      <IndianPhoneInput
        id="register-mobile"
        value={mobile}
        onChange={onChange}
        variant="merchant"
        placeholder="10-digit mobile number"
        className="min-w-0 flex-1"
        error={error}
      />
      <button
        type="button"
        onClick={onSubmit}
        className={`inline-flex shrink-0 items-center justify-center gap-2 px-6 py-3.5 sm:min-w-[148px] ${merchantAuthBtnPrimary}`}
      >
        Get started
        <ArrowRight size={16} />
      </button>
    </div>
  );
}

function PartnerLoginCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 text-center ${className}`}>
      <p className="text-sm text-zinc-600">
        Already on FinderB?{' '}
        <Link href="/business/login" className="font-bold text-[#153551] hover:text-[#215481]">
          Sign in to your dashboard →
        </Link>
      </p>
    </div>
  );
}

type BusinessRegisterLandingProps = {
  mobile: string;
  onMobileChange: (value: string) => void;
  mobileError?: string;
  onStart: () => void;
  onPlanSelect: (plan: 'free' | 'pro', billing?: 'monthly' | 'annual') => void;
  stats: Stat[];
  successStories: Story[];
  steps: Step[];
  faqs: Faq[];
};

export default function BusinessRegisterLanding({
  mobile,
  onMobileChange,
  mobileError,
  onStart,
  onPlanSelect,
  stats,
  successStories,
  steps,
  faqs,
}: BusinessRegisterLandingProps) {
  const scrollToHero = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('mobile-input')?.focus();
  };

  return (
    <>
      <RegisterHero
        mobile={mobile}
        onMobileChange={onMobileChange}
        onStart={onStart}
        mobileError={mobileError}
        stats={stats}
      />

      <PricingFontRoot>
        <div className="pricing-page">
          <PricingPlansSection
            mode="register"
            sectionId="register-pricing"
            onChooseFree={() => onPlanSelect('free')}
            onChoosePro={(billing) => onPlanSelect('pro', billing)}
          />
        </div>
      </PricingFontRoot>

      {/* Stories */}
      <section className="border-y border-zinc-200/70 bg-white py-4 sm:py-5">
        <MerchantAuthMain>
          <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#0f273b] sm:text-3xl">
                Real growth from real businesses
              </h2>
            </div>
            <div className="flex items-center gap-1 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={16} className="fill-current" />
              ))}
              <span className="ml-2 text-sm font-medium text-zinc-500">Trusted nationwide</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {successStories.map((story) => (
              <article
                key={story.name}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white transition-shadow hover:shadow-lg"
              >
                <div className="h-1 bg-gradient-to-r from-[#f9b864] to-[#215481] opacity-80 transition-opacity group-hover:opacity-100" />
                <div className="flex flex-1 flex-col p-6">
                  <span className="merchant-auth-quote-mark text-5xl text-[#f9b864]/40">&ldquo;</span>
                  <p className="-mt-4 flex-1 text-sm leading-relaxed text-zinc-600">
                    {story.testimonial}
                  </p>
                  <div className="mt-6 flex items-center gap-3 border-t border-zinc-100 pt-5">
                    <div className="h-11 w-11 overflow-hidden rounded-full ring-2 ring-[#f9b864]/30">
                      <Image
                        src={story.image}
                        alt={story.name}
                        width={44}
                        height={44}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-zinc-900">{story.name}</p>
                      <p className="truncate text-xs text-[#215481]">{story.role}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-zinc-50 px-6 py-2.5 text-[11px] text-zinc-500">{story.duration}</div>
              </article>
            ))}
          </div>
        </MerchantAuthMain>
      </section>

      {/* Steps */}
      <section className="merchant-auth-section-muted py-4 sm:py-5">
        <MerchantAuthMain>
          <div className="mx-auto mb-3 max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-[#0f273b] sm:text-3xl">
              Three steps to go live
            </h2>
          </div>

          <ol className="grid gap-4 md:grid-cols-3">
            {steps.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.step}
                  className="relative rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#153551] text-sm font-bold text-white">
                      {item.step}
                    </span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f9b864]/15 text-[#153551]">
                      <Icon size={20} strokeWidth={2} />
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">{item.desc}</p>
                </li>
              );
            })}
          </ol>

          <div className="mt-3 flex justify-center">
            <button type="button" onClick={scrollToHero} className={`px-8 py-3.5 ${merchantAuthBtnPrimary}`}>
              Start step 1
              <ArrowRight size={16} />
            </button>
          </div>
        </MerchantAuthMain>
      </section>

      {/* Benefits + FAQ */}
      <section className="py-4 sm:py-5">
        <MerchantAuthMain>
          <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#0f273b] sm:text-3xl">
                Built for merchants who want more footfall, not more complexity
              </h2>

              <div className="mt-3 space-y-2.5">
                {[
                  {
                    icon: Users,
                    title: 'Reach active searchers',
                    desc: 'Appear when people look for your category in your city.',
                  },
                  {
                    icon: Smartphone,
                    title: 'Manage from anywhere',
                    desc: 'Update listing, reply to leads, and track growth on any device.',
                  },
                  {
                    icon: Star,
                    title: 'Build trust with reviews',
                    desc: 'Collect ratings and respond — credibility that converts.',
                  },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#153551]/8 text-[#153551]">
                      <Icon size={18} />
                    </span>
                    <div>
                      <h4 className="font-bold text-zinc-900">{title}</h4>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-600">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 max-w-md">
                <MobileRegisterInput
                  mobile={mobile}
                  onChange={onMobileChange}
                  onSubmit={onStart}
                  error={mobileError}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-900">Common questions</h3>
                <HelpCircle className="text-[#215481]" size={22} />
              </div>
              <div className="space-y-3">
                {faqs.map((faq) => (
                  <div
                    key={faq.q}
                    className="rounded-xl border border-zinc-100 bg-zinc-50/60 px-4 py-3.5"
                  >
                    <h4 className="text-sm font-bold text-zinc-900">{faq.q}</h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{faq.a}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t border-zinc-100 pt-4">
                <PartnerLoginCard />
              </div>
            </div>
          </div>
        </MerchantAuthMain>
      </section>

      {/* Final CTA */}
      <section className="merchant-auth-panel-dark py-4 sm:py-5">
        <MerchantAuthMain>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold !text-white sm:text-3xl">
              Your next customer is already searching on FinderB
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
              Join thousands of local businesses. Listing is free and takes only a few minutes.
            </p>
            <button
              type="button"
              onClick={scrollToHero}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#f9b864] px-8 py-3.5 text-sm font-bold text-[#153551] transition-colors hover:bg-[#ffcc70]"
            >
              List your business free
              <ArrowRight size={16} />
            </button>
          </div>
        </MerchantAuthMain>
      </section>
    </>
  );
}
