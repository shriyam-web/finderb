/** How long a started checkout can still be paid. After this, that same attempt cannot finish. */
export const CHECKOUT_WINDOW_MS = 15 * 60 * 1000;

/**
 * Pending means money can still land on this same attempt: the window is open,
 * Razorpay already has a payment id, or a renewal debit is with the bank.
 * Closing the window, or the merchant leaving checkout, is cancelled.
 * A bank or Razorpay decline stays failed.
 */
export function settleCheckoutStatus(input: {
  status: string;
  createdAt?: string | null;
  paymentId?: string | null;
  paymentType?: string | null;
  now?: number;
}): string {
  const status = String(input.status || '').trim().toLowerCase();
  if (
    status === 'completed' ||
    status === 'failed' ||
    status === 'cancelled' ||
    status === 'attempted'
  ) {
    return status;
  }
  if (status !== 'pending') return status || 'cancelled';
  if (input.paymentId) return 'pending';
  if (input.paymentType === 'subscription_renewal') return 'pending';

  const created = input.createdAt ? Date.parse(input.createdAt) : Number.NaN;
  const now = input.now ?? Date.now();
  if (!Number.isFinite(created) || now - created >= CHECKOUT_WINDOW_MS) return 'cancelled';
  return 'pending';
}

/** Admin should look only when money moved and then got stuck, or the bank declined it. */
export function isGenuinePaymentIssue(input: {
  status: string;
  createdAt?: string | null;
  paymentId?: string | null;
  paymentType?: string | null;
  now?: number;
}): boolean {
  const status = settleCheckoutStatus(input);
  if (status === 'failed') return true;
  if (status !== 'pending') return false;
  if (!input.paymentId && input.paymentType !== 'subscription_renewal') return false;
  const created = input.createdAt ? Date.parse(input.createdAt) : Number.NaN;
  const now = input.now ?? Date.now();
  return Number.isFinite(created) && now - created >= CHECKOUT_WINDOW_MS;
}
