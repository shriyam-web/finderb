-- Indexes for findBusinessForIdentity (lib/auth/merchantPortal.server.ts).
-- Every app/web session check looks up the linked business by exact email or
-- 10-digit mobile; mobile already has "Business_mobile_key". These let Postgres
-- answer the OR lookup with a bitmap index scan instead of a full table scan.

CREATE INDEX IF NOT EXISTS idx_business_work_email
  ON "Business" ("workEmail")
  WHERE "workEmail" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_business_email
  ON "Business" (email)
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_business_owner_mobile
  ON "Business" (owner_mobile)
  WHERE owner_mobile IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_business_public_phone
  ON "Business" ("publicPhone")
  WHERE "publicPhone" IS NOT NULL;
