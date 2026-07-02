-- Private owner contact info for merchant records (not shown on public profile).
-- Safe to re-run.

ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS owner_mobile TEXT;
