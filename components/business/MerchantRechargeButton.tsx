'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  completeMerchantPayment,
  createMerchantPaymentOrder,
  getRazorpayGatewayStatus,
} from '@/app/actions/payment';
import { openRazorpayCheckout } from '@/lib/razorpay/client';
import type { BillingCycle } from '@/lib/razorpay/plans';

type MerchantRechargeButtonProps = {
  businessId: string;
  businessName?: string;
  fullName?: string;
  email?: string;
  mobile?: string;
  billingCycle?: BillingCycle;
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
  disabled = false,
  label = 'Recharge Now',
  className = '',
  onSuccess,
  onError,
}: MerchantRechargeButtonProps) {
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [razorpayConfigured, setRazorpayConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    getRazorpayGatewayStatus().then((status) => {
      setRazorpayConfigured(status.configured);
    });
  }, []);

  const handleRecharge = useCallback(async () => {
    if (!businessId || paying) return;

    if (razorpayConfigured === false) {
      const message =
        'Razorpay is not configured. Add NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local.';
      onError?.(message);
      return;
    }

    setPaying(true);

    try {
      const orderResult = await createMerchantPaymentOrder({
        businessId,
        plan: 'pro',
        billingCycle,
      });

      if (!orderResult.success) {
        onError?.(orderResult.error || 'Could not start payment');
        setPaying(false);
        return;
      }

      await openRazorpayCheckout(
        {
          key: orderResult.keyId,
          amount: orderResult.order.amount,
          currency: orderResult.order.currency,
          name: 'FinderB Business',
          description: `Growth Pro — ${billingCycle === 'monthly' ? 'Monthly' : 'Annual'}`,
          order_id: orderResult.order.id,
          prefill: {
            name: fullName || businessName || orderResult.business.fullName,
            email: email || orderResult.business.email || undefined,
            contact: mobile || orderResult.business.mobile || undefined,
          },
          notes: {
            businessId,
            plan: 'pro',
            billingCycle,
          },
          theme: { color: '#215481' },
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
                router.push(`/business/dashboard?id=${businessId}&payment=success`);
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
    email,
    fullName,
    mobile,
    onError,
    onSuccess,
    paying,
    razorpayConfigured,
    router,
  ]);

  const isDisabled = disabled || paying || razorpayConfigured === false;

  return (
    <button
      type="button"
      onClick={handleRecharge}
      disabled={isDisabled}
      className={className}
      title={razorpayConfigured === false ? 'Razorpay keys missing in server environment' : undefined}
    >
      {paying ? (
        <>
          <Loader2 className="inline h-4 w-4 animate-spin" />
          <span>Opening Razorpay…</span>
        </>
      ) : (
        label
      )}
    </button>
  );
}
