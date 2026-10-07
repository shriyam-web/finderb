-- Owner mobile verification flag for businesses (email already has "emailVerified").
-- Safe to re-run.

ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "mobileVerified" BOOLEAN NOT NULL DEFAULT false;
