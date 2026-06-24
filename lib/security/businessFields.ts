/** Fields that must never appear in public API responses. */
const SENSITIVE_BUSINESS_KEYS = [
  'password',
  'panNumber',
  'aadharNumber',
  'panUrl',
  'aadharUrl',
  'msmeGstUrl',
  'kycStatus',
  'paymentId',
  'orderId',
  'paymentStatus',
  'billingCycle',
  'planStartedAt',
  'planExpiresAt',
  'razorpaySubscriptionId',
  'subscriptionStatus',
  'autoRenewEnabled',
  'mandateStatus',
  'subscriptionCancelledAt',
  'fullName',
  'mobile',
  'workEmail',
] as const;

export function redactPublicBusinessFields<T extends Record<string, unknown>>(business: T): T {
  const redacted = { ...business };
  for (const key of SENSITIVE_BUSINESS_KEYS) {
    delete redacted[key];
  }
  return redacted;
}
