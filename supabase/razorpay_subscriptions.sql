-- Razorpay Subscriptions (monthly mandate / auto-debit)
-- Run after merchant_subscriptions.sql

ALTER TABLE "Business"
  ADD COLUMN IF NOT EXISTS "razorpaySubscriptionId" TEXT,
  ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "autoRenewEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "mandateStatus" TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS "subscriptionCancelledAt" TIMESTAMPTZ;

ALTER TABLE merchant_payments
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_type TEXT NOT NULL DEFAULT 'one_time';

CREATE INDEX IF NOT EXISTS idx_business_razorpay_subscription_id ON "Business"("razorpaySubscriptionId");
CREATE INDEX IF NOT EXISTS idx_merchant_payments_subscription_id ON merchant_payments(razorpay_subscription_id);
CREATE INDEX IF NOT EXISTS idx_business_subscription_status ON "Business"("subscriptionStatus");
