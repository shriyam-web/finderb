'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  completeMerchantPayment,
  createMerchantPaymentOrder,
  getRazorpayGatewayStatus,
} from '@/app/actions/payment';
import {
  openRazorpayCheckout,
  openRazorpaySubscriptionCheckout,
} from '@/lib/razorpay/client';
import type { BillingCycle } from '@/lib/razorpay/plans';

type MerchantRechargeButtonProps = {
  businessId: string;
  businessName?: string;
  fullName?: string;
  email?: string;
  mobile?: string;
  billingCycle?: BillingCycle;
  /** When true, opens Razorpay directly (e.g. register flow with plan already chosen). */
  directCheckout?: boolean;
  disabled?: boolean;
  label?: string;
  className?: string;
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

export default function MerchantRechargeButton({
  businessId,
  businessName = '',
  fullName = '',
  email = '',
  mobile = '',
  billingCycle = 'monthly',
  directCheckout = false,
  disabled = false,
  label = 'Recharge Now',
  className = '',
  onSuccess,
  onError,
}: MerchantRechargeButtonProps) {
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [gatewayReady, setGatewayReady] = useState<boolean | null>(null);

  useEffect(() => {
    if (!directCheckout) return;
    getRazorpayGatewayStatus().then((status) => {
      const ready =
        status.configured &&
        (billingCycle === 'annual' || status.subscriptionsConfigured);
      setGatewayReady(ready);
    });
  }, [billingCycle, directCheckout]);

  const handleRecharge = useCallback(async () => {
    if (!businessId || paying) return;

    if (!directCheckout) {
      router.push(`/pricing?businessId=${encodeURIComponent(businessId)}`);
      return;
    }

    if (gatewayReady === false) {
      const message =
        billingCycle === 'monthly'
          ? 'Monthly auto-debit is not configured. Add Razorpay keys and RAZORPAY_PLAN_ID_PRO_MONTHLY.'
          : 'Razorpay is not configured. Add NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.';
      onError?.(message);
      return;
    }

    setPaying(true);

    try {
      const checkoutResult = await createMerchantPaymentOrder({
        businessId,
        plan: 'pro',
        billingCycle,
      });

      if (!checkoutResult.success) {
        onError?.(checkoutResult.error || 'Could not start payment');
        setPaying(false);
        return;
      }

      const prefill = {
        name: fullName || businessName || checkoutResult.business.fullName,
        email: email || checkoutResult.business.email || undefined,
        contact: mobile || checkoutResult.business.mobile || undefined,
      };

      const notes = {
        businessId,
        plan: 'pro',
        billingCycle,
      };

      const theme = { color: '#215481' };

      if (checkoutResult.checkoutMode === 'subscription') {
        await openRazorpaySubscriptionCheckout(
          {
            key: checkoutResult.keyId,
            subscription_id: checkoutResult.subscription.id,
            name: 'FinderB Business',
            description: 'Growth Pro — Monthly auto-debit mandate',
            prefill,
            notes,
            theme,
            handler: async (response) => {
              try {
                const verifyResult = await completeMerchantPayment({
                  businessId,
                  plan: 'pro',
                  billingCycle,
                  razorpaySubscriptionId: response.razorpay_subscription_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                });

                if (verifyResult.success) {
                  onSuccess?.();
                  router.push(`/business/dashboard?id=${businessId}&payment=success&tab=subscription`);
                } else {
                  onError?.(verifyResult.error || 'Mandate verification failed');
                  setPaying(false);
                }
              } catch {
                onError?.('Mandate verification failed. Contact support if amount was deducted.');
                setPaying(false);
              }
            },
            modal: {
              ondismiss: () => setPaying(false),
            },
          },
          (message) => {
            onError?.(message);
            setPaying(false);
          }
        );
        return;
      }

      await openRazorpayCheckout(
        {
          key: checkoutResult.keyId,
          amount: checkoutResult.order.amount,
          currency: checkoutResult.order.currency,
          name: 'FinderB Business',
          description: `Growth Pro — Annual (one-time)`,
          order_id: checkoutResult.order.id,
          prefill,
          notes,
          theme,
          handler: async (response) => {
            try {
              const verifyResult = await completeMerchantPayment({
                businessId,
                plan: 'pro',
                billingCycle,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });

              if (verifyResult.success) {
                onSuccess?.();
                router.push(`/business/dashboard?id=${businessId}&payment=success&tab=subscription`);
              } else {
                onError?.(verifyResult.error || 'Payment verification failed');
                setPaying(false);
              }
            } catch {
              onError?.('Payment verification failed. Contact support if amount was deducted.');
              setPaying(false);
            }
          },
          modal: {
            ondismiss: () => setPaying(false),
          },
        },
        (message) => {
          onError?.(message);
          setPaying(false);
        }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to open payment gateway';
      onError?.(message);
      setPaying(false);
    }
  }, [
    billingCycle,
    businessId,
    businessName,
    directCheckout,
    email,
    fullName,
    gatewayReady,
    mobile,
    onError,
    onSuccess,
    paying,
    router,
  ]);

  const isDisabled = disabled || paying || (directCheckout && gatewayReady === false);

  return (
    <button
      type="button"
      onClick={handleRecharge}
      disabled={isDisabled}
      className={className}
      title={
        directCheckout && gatewayReady === false
          ? 'Razorpay subscription billing is not fully configured'
          : undefined
      }
    >
      {paying ? (
        <>
          <Loader2 className="inline h-4 w-4 animate-spin" />
          <span>{billingCycle === 'monthly' ? 'Opening mandate setup…' : 'Opening Razorpay…'}</span>
        </>
      ) : (
        label
      )}
    </button>
  );
}
