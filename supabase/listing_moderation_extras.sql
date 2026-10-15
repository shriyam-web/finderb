-- Verification flags, unread leads, and related listing extras.

ALTER TABLE "Business"
  ADD COLUMN IF NOT EXISTS "whatsappVerified" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "phoneVerified" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS merchant_read_at TIMESTAMPTZ;

UPDATE "Business"
SET "whatsappVerified" = true
WHERE "mobileVerified" = true
  AND length(regexp_replace(coalesce("whatsappNumber", ''), '\D', '', 'g')) = 10
  AND regexp_replace(coalesce("whatsappNumber", ''), '\D', '', 'g')
    = regexp_replace(coalesce("mobile", "publicPhone", ''), '\D', '', 'g');

UPDATE leads
SET merchant_read_at = COALESCE(updated_at, created_at, NOW())
WHERE merchant_read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_leads_merchant_read_at ON leads (business_id, merchant_read_at);
CREATE INDEX IF NOT EXISTS idx_business_change_requests_status ON business_change_requests (status, created_at DESC);
