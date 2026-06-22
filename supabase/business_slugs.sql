-- SEO-friendly business profile URLs
-- Run in Supabase SQL editor after deploying application code.

ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_business_slug_unique
  ON "Business" (slug)
  WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_business_slug_lookup
  ON "Business" (slug)
  WHERE status = 'Active';

COMMENT ON COLUMN "Business".slug IS 'SEO URL slug, e.g. radisson-blu-noida';
