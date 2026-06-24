-- Merchant subscription dates on Business + payment audit trail
-- Run in Supabase SQL editor or via migration tooling.

ALTER TABLE "Business"
  ADD COLUMN IF NOT EXISTS "planStartedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "planExpiresAt" TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS merchant_payments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL REFERENCES "Business"(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  billing_cycle TEXT NOT NULL,
  amount_paise INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending',
  order_id TEXT,
  payment_id TEXT UNIQUE,
  source TEXT,
  plan_started_at TIMESTAMPTZ,
  plan_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_merchant_payments_business_id ON merchant_payments(business_id);
CREATE INDEX IF NOT EXISTS idx_merchant_payments_status ON merchant_payments(status);
CREATE INDEX IF NOT EXISTS idx_merchant_payments_created_at ON merchant_payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_merchant_payments_order_id ON merchant_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_merchant_payments_payment_id ON merchant_payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_business_plan_expires_at ON "Business"("planExpiresAt");

-- Backfill subscription end dates for merchants who already paid
UPDATE "Business"
SET
  "planStartedAt" = COALESCE("planStartedAt", "updatedAt", "createdAt"),
  "planExpiresAt" = COALESCE(
    "planExpiresAt",
    CASE
      WHEN "billingCycle" = 'annual' THEN COALESCE("updatedAt", "createdAt") + INTERVAL '1 year'
      ELSE COALESCE("updatedAt", "createdAt") + INTERVAL '1 month'
    END
  )
WHERE "paymentStatus" = 'completed' AND "planExpiresAt" IS NULL;

-- Backfill payment history rows for existing completed payments (one row per merchant)
INSERT INTO merchant_payments (
  business_id,
  plan,
  billing_cycle,
  amount_paise,
  currency,
  status,
  order_id,
  payment_id,
  source,
  plan_started_at,
  plan_expires_at,
  created_at,
  updated_at
)
SELECT
  b.id,
  b."selectedPlan",
  b."billingCycle",
  CASE WHEN b."billingCycle" = 'annual' THEN 358800 ELSE 49900 END,
  'INR',
  'completed',
  b."orderId",
  b."paymentId",
  'legacy',
  COALESCE(b."planStartedAt", b."updatedAt", b."createdAt"),
  COALESCE(b."planExpiresAt", b."updatedAt", b."createdAt"),
  COALESCE(b."updatedAt", b."createdAt"),
  COALESCE(b."updatedAt", b."createdAt")
FROM "Business" b
WHERE b."paymentStatus" = 'completed'
  AND b."paymentId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM merchant_payments mp WHERE mp.payment_id = b."paymentId"
  );
