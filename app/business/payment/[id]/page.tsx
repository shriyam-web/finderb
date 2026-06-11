'use client';

import { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  completeMerchantPayment,
  createMerchantPaymentOrder,
  getPaymentPageData,
} from '@/app/actions/payment';
import { MERCHANT_PLANS } from '@/lib/razorpay/plans';
import { openRazorpayCheckout } from '@/lib/razorpay/client';

type BillingCycle = 'monthly' | 'annual';

export default function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [business, setBusiness] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [razorpayConfigured, setRazorpayConfigured] = useState(false);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const plan = MERCHANT_PLANS.pro;
  const price = plan.prices[billingCycle];

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError('');
    const result = await getPaymentPageData(id);
    if (!result.success) {
      setError(result.error || 'Unable to load payment page');
      setLoading(false);
      return;
    }
    setBusiness(result.business);
    setIsAuthorized(result.isAuthorized);
    setRazorpayConfigured(result.razorpayConfigured);
    if (!result.isAuthorized) {
      setError(result.authError || 'Please sign in to continue');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const handleRazorpayPayment = async () => {
    if (!isAuthorized) {
      setError('Please sign in to your merchant account before paying.');
      return;
    }

    if (!razorpayConfigured) {
      setError('Payment gateway is not configured yet. Add Razorpay API keys to your environment.');
      return;
    }

    if (business?.paymentStatus === 'completed') {
      router.push(`/business/dashboard?id=${id}`);
      return;
    }

    setPaying(true);
    setError('');

    try {
      const orderResult = await createMerchantPaymentOrder({
        businessId: id,
        plan: 'pro',
        billingCycle,
      });

      if (!orderResult.success) {
        setError(orderResult.error || 'Could not start payment');
        setPaying(false);
        return;
      }

      await openRazorpayCheckout(
        {
          key: orderResult.keyId,
          amount: orderResult.order.amount,
          currency: orderResult.order.currency,
          name: 'FinderB Business',
          description: `${plan.name} — ${billingCycle === 'monthly' ? 'Monthly' : 'Annual'}`,
          order_id: orderResult.order.id,
          prefill: {
            name: orderResult.business.fullName || orderResult.business.businessName,
            email: orderResult.business.email || undefined,
            contact: orderResult.business.mobile || undefined,
          },
          notes: {
            businessId: id,
            plan: 'pro',
            billingCycle,
          },
          theme: { color: '#215481' },
          handler: async (response) => {
            try {
              const verifyResult = await completeMerchantPayment({
                businessId: id,
                plan: 'pro',
                billingCycle,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });

              if (verifyResult.success) {
                router.push(`/business/dashboard?id=${id}&payment=success`);
              } else {
                setError(verifyResult.error || 'Payment verification failed');
                setPaying(false);
              }
            } catch {
              setError('Payment verification failed. Please contact support if amount was deducted.');
              setPaying(false);
            }
          },
          modal: {
            ondismiss: () => setPaying(false),
          },
        },
        (message) => {
          setError(message);
          setPaying(false);
        }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to open payment gateway';
      setError(message);
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb]">
        <Loader2 className="h-8 w-8 animate-spin text-[#215481]" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f4f7fb] px-4">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="text-center text-sm text-slate-600">{error || 'Business not found'}</p>
        <Link href="/business/login" className="text-sm font-semibold text-[#215481] hover:underline">
          Go to merchant login
        </Link>
      </div>
    );
  }

  const isPaid = business.paymentStatus === 'completed';

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 pb-12 pt-24 md:px-8 md:pt-32">
      <div className="mx-auto flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_24px_64px_-32px_rgba(15,39,59,0.28)] md:min-h-[560px] md:flex-row">
        {/* Left panel */}
        <div className="relative flex w-full flex-col justify-between overflow-hidden bg-[#153551] p-8 text-white md:w-[320px] md:p-10">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-3xl" />

          <div className="relative z-10 space-y-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-bold text-[#215481]">
                F
              </div>
              <span className="text-lg font-bold tracking-tight">FinderB Business</span>
            </Link>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <div className="mb-2 flex items-center gap-2">
                  <CreditCard size={16} className="text-[#f9b864]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Premium access</span>
                </div>
                <p className="text-xs leading-relaxed text-white/75">
                  Activate leads and unlock full growth features for your listing.
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Business</p>
                <p className="mt-1 text-xl font-bold">{business.businessName}</p>
                {business.registrationNumber && (
                  <p className="mt-1 text-xs text-white/50">ID: {business.registrationNumber}</p>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="relative z-10 mt-8 flex items-center gap-2 text-xs font-semibold text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft size={14} />
            Back to dashboard
          </button>
        </div>

        {/* Right panel */}
        <div className="relative flex flex-1 flex-col justify-center p-6 md:p-10">
          {paying && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#215481]" />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#215481]">
                Opening Razorpay…
              </p>
            </div>
          )}

          <div className="mx-auto w-full max-w-md space-y-8">
            {isPaid ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Payment complete</h2>
                <p className="text-sm text-slate-500">
                  Your Growth Pro plan is active. Lead contacts and premium features are unlocked.
                </p>
                <Link
                  href={`/business/dashboard?id=${id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#215481] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1a4367]"
                >
                  Go to dashboard
                  <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-1 text-center">
                  <h2 className="text-2xl font-bold text-slate-900">Growth Pro</h2>
                  <p className="text-sm text-slate-500">Pay securely via Razorpay</p>
                </div>

                <div className="mx-auto flex w-fit rounded-2xl border border-slate-200 bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`rounded-xl px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                      billingCycle === 'monthly'
                        ? 'bg-white text-[#215481] shadow-sm'
                        : 'text-slate-400'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('annual')}
                    className={`relative rounded-xl px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                      billingCycle === 'annual'
                        ? 'bg-white text-[#215481] shadow-sm'
                        : 'text-slate-400'
                    }`}
                  >
                    Annual
                    <span className="absolute -right-1 -top-2 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[8px] font-bold text-white">
                      -20%
                    </span>
                  </button>
                </div>

                <div className="rounded-2xl border border-[#215481]/15 bg-gradient-to-br from-[#215481] to-[#1a4367] p-6 text-white shadow-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                      <p className="mt-0.5 text-xs text-white/70">{plan.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold">{price.display}</p>
                      <p className="text-[10px] font-semibold uppercase text-white/60">
                        / {billingCycle === 'monthly' ? 'month' : 'year'}
                      </p>
                    </div>
                  </div>

                  <ul className="mt-5 space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-xs">
                        <CheckCircle2 size={14} className="shrink-0 text-[#f9b864]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <div>
                      <p>{error}</p>
                      {!isAuthorized && (
                        <Link
                          href="/business/login"
                          className="mt-1 inline-block font-semibold text-[#215481] underline-offset-2 hover:underline"
                        >
                          Sign in to merchant portal
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                {!razorpayConfigured && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs text-amber-800">
                    Razorpay keys are missing. Set{' '}
                    <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_RAZORPAY_KEY_ID</code> and{' '}
                    <code className="rounded bg-amber-100 px-1">RAZORPAY_KEY_SECRET</code> in{' '}
                    <code className="rounded bg-amber-100 px-1">.env.local</code>.
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleRazorpayPayment}
                    disabled={paying || !isAuthorized || !razorpayConfigured}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 text-sm font-bold text-white transition-all hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CreditCard size={18} />
                    Pay with Razorpay
                    <ArrowRight size={16} />
                  </button>
                  <div className="flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    Secured by Razorpay
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
