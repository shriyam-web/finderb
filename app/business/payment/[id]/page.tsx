'use client';

import { use, useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  abandonMerchantCheckout,
  completeMerchantPayment,
  createMerchantPaymentOrder,
  getPaymentPageData,
  recordMerchantCheckoutFailure,
} from '@/app/actions/payment';
import { MERCHANT_PLANS } from '@/lib/razorpay/plans';
import { openRazorpayCheckout, openRazorpaySubscriptionCheckout } from '@/lib/razorpay/client';
import { getMerchantSubscriptionStatus } from '@/lib/subscription/merchantSubscription';
import MerchantPaymentCheckout, {
  MerchantPaymentError,
  MerchantPaymentLoading,
  MerchantPaymentSuccess,
} from '@/components/business/MerchantPaymentCheckout';

type BillingCycle = 'monthly' | 'annual';

function PaymentPageContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutRequested = searchParams.get('checkout') === '1';
  const billingFromUrl = searchParams.get('billing');
  const checkoutStartedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [business, setBusiness] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [razorpayConfigured, setRazorpayConfigured] = useState(false);
  const [subscriptionsConfigured, setSubscriptionsConfigured] = useState(false);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const plan = MERCHANT_PLANS.pro;

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
    setIsAuthorized(true);
    setRazorpayConfigured(result.razorpayConfigured);
    setSubscriptionsConfigured(result.subscriptionsConfigured);
    const savedBilling = (result.business as { billingCycle?: string })?.billingCycle;
    if (billingFromUrl === 'monthly' || billingFromUrl === 'annual') {
      setBillingCycle(billingFromUrl);
    } else if (savedBilling === 'monthly' || savedBilling === 'annual') {
      setBillingCycle(savedBilling);
    }
    setLoading(false);
  }, [billingFromUrl, id]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const handleRazorpayPayment = useCallback(
    async (cycleOverride?: BillingCycle) => {
      const cycle = cycleOverride ?? billingCycle;

      if (!isAuthorized) {
        setError('Please sign in to your merchant account before paying.');
        return;
      }

      if (!razorpayConfigured) {
        setError('Online payment is not available right now. Please try again later or contact support.');
        return;
      }

      if (cycle === 'monthly' && !subscriptionsConfigured) {
        setError(
          'Monthly auto-debit is not available right now. Please try again later or contact support.',
        );
        return;
      }

      const subscription = getMerchantSubscriptionStatus({
        paymentStatus: business?.paymentStatus,
        selectedPlan: business?.selectedPlan,
        billingCycle: business?.billingCycle,
        planStartedAt: business?.planStartedAt,
        planExpiresAt: business?.planExpiresAt,
        updatedAt: business?.updatedAt,
        createdAt: business?.createdAt,
        autoRenewEnabled: business?.autoRenewEnabled,
        mandateStatus: business?.mandateStatus,
        subscriptionStatus: business?.subscriptionStatus,
        razorpaySubscriptionId: business?.razorpaySubscriptionId,
      });

      if (subscription.isActive && !checkoutRequested) {
        router.push(`/business/dashboard?id=${id}&tab=subscription`);
        return;
      }

      setPaying(true);
      setError('');

      try {
        const orderResult = await createMerchantPaymentOrder({
          businessId: id,
          plan: 'pro',
          billingCycle: cycle,
        });

        if (!orderResult.success) {
          setError(orderResult.error || 'Could not start payment');
          setPaying(false);
          return;
        }

        const prefill = {
          name: orderResult.business.fullName || orderResult.business.businessName,
          email: orderResult.business.email || undefined,
          contact: orderResult.business.mobile || undefined,
        };
        const notes = { businessId: id, plan: 'pro', billingCycle: cycle };
        const theme = { color: '#215481' };

        if (orderResult.checkoutMode === 'subscription') {
          await openRazorpaySubscriptionCheckout(
            {
              key: orderResult.keyId,
              subscription_id: orderResult.subscription.id,
              name: 'FinderB Business',
              description: `${plan.name} — Monthly mandate & auto-debit`,
              prefill,
              notes,
              theme,
              handler: async (response) => {
                try {
                  const verifyResult = await completeMerchantPayment({
                    businessId: id,
                    plan: 'pro',
                    billingCycle: cycle,
                    razorpaySubscriptionId: response.razorpay_subscription_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature,
                  });

                  if (verifyResult.success) {
                    router.push(`/business/dashboard?id=${id}&payment=success&tab=subscription`);
                  } else {
                    setError(verifyResult.error || 'Mandate verification failed');
                    setPaying(false);
                  }
                } catch {
                  setError('Mandate verification failed. Contact support if amount was deducted.');
                  setPaying(false);
                }
              },
              modal: {
                ondismiss: () => {
                  void abandonMerchantCheckout({
                    businessId: id,
                    subscriptionId: orderResult.subscription.id,
                  });
                  setPaying(false);
                },
              },
            },
            (message) => {
              void recordMerchantCheckoutFailure({
                businessId: id,
                subscriptionId: orderResult.subscription.id,
              });
              setError(message);
              setPaying(false);
            }
          );
          return;
        }

        await openRazorpayCheckout(
          {
            key: orderResult.keyId,
            amount: orderResult.order.amount,
            currency: orderResult.order.currency,
            name: 'FinderB Business',
            description: `${plan.name} — Annual (one-time)`,
            order_id: orderResult.order.id,
            prefill,
            notes,
            theme,
            handler: async (response) => {
              try {
                const verifyResult = await completeMerchantPayment({
                  businessId: id,
                  plan: 'pro',
                  billingCycle: cycle,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                });

                if (verifyResult.success) {
                  router.push(`/business/dashboard?id=${id}&payment=success&tab=subscription`);
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
              ondismiss: () => {
                void abandonMerchantCheckout({
                  businessId: id,
                  orderId: orderResult.order.id,
                });
                setPaying(false);
              },
            },
          },
          (message) => {
            void recordMerchantCheckoutFailure({
              businessId: id,
              orderId: orderResult.order.id,
            });
            setError(message);
            setPaying(false);
          }
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to open payment gateway';
        setError(message);
        setPaying(false);
      }
    },
    [billingCycle, business, checkoutRequested, id, isAuthorized, plan.name, razorpayConfigured, router, subscriptionsConfigured]
  );

  useEffect(() => {
    if (loading || paying || !business || !isAuthorized || !razorpayConfigured) return;
    if (!checkoutRequested || checkoutStartedRef.current) return;

    const cycle: BillingCycle =
      billingFromUrl === 'annual' ? 'annual' : billingFromUrl === 'monthly' ? 'monthly' : billingCycle;

    if (cycle === 'monthly' && !subscriptionsConfigured) return;

    const subscription = getMerchantSubscriptionStatus({
      paymentStatus: business?.paymentStatus,
      selectedPlan: business?.selectedPlan,
      billingCycle: business?.billingCycle,
      planStartedAt: business?.planStartedAt,
      planExpiresAt: business?.planExpiresAt,
      updatedAt: business?.updatedAt,
      createdAt: business?.createdAt,
      autoRenewEnabled: business?.autoRenewEnabled,
      mandateStatus: business?.mandateStatus,
      subscriptionStatus: business?.subscriptionStatus,
      razorpaySubscriptionId: business?.razorpaySubscriptionId,
    });

    if (subscription.isActive && !checkoutRequested) return;

    checkoutStartedRef.current = true;
    if (billingFromUrl === 'monthly' || billingFromUrl === 'annual') {
      setBillingCycle(cycle);
    }
    void handleRazorpayPayment(cycle);
  }, [
    billingCycle,
    billingFromUrl,
    business,
    checkoutRequested,
    handleRazorpayPayment,
    isAuthorized,
    loading,
    paying,
    razorpayConfigured,
    subscriptionsConfigured,
  ]);

  const handleBack = () => {
    if (checkoutRequested) {
      router.push(`/pricing?businessId=${encodeURIComponent(id)}`);
      return;
    }
    router.push(`/business/dashboard?id=${id}`);
  };

  if (loading) {
    return <MerchantPaymentLoading />;
  }

  if (!business) {
    return <MerchantPaymentError message={error || 'Business not found'} />;
  }

  const subscription = getMerchantSubscriptionStatus({
    paymentStatus: business.paymentStatus,
    selectedPlan: business.selectedPlan,
    billingCycle: business.billingCycle,
    planStartedAt: business.planStartedAt,
    planExpiresAt: business.planExpiresAt,
    updatedAt: business.updatedAt,
    createdAt: business.createdAt,
    autoRenewEnabled: business.autoRenewEnabled,
    mandateStatus: business.mandateStatus,
    subscriptionStatus: business.subscriptionStatus,
    razorpaySubscriptionId: business.razorpaySubscriptionId,
  });

  if (subscription.isActive && !checkoutRequested) {
    return (
      <MerchantPaymentSuccess
        businessId={id}
        businessName={business.businessName}
        planName={subscription.planName}
      />
    );
  }

  return (
    <MerchantPaymentCheckout
      business={business}
      billingCycle={billingCycle}
      onBillingChange={setBillingCycle}
      paying={paying}
      error={error}
      isAuthorized={isAuthorized}
      razorpayConfigured={razorpayConfigured}
      checkoutRequested={checkoutRequested}
      onPay={() => void handleRazorpayPayment()}
      onBack={handleBack}
    />
  );
}

export default function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <Suspense fallback={<MerchantPaymentLoading />}>
      <PaymentPageContent id={id} />
    </Suspense>
  );
}
