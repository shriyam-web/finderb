-- Performance indexes for FinderB (category pages + merchant dashboard).
-- Run once in Supabase SQL Editor (Dashboard → SQL → New query).
--
-- Table name is "Business" (quoted, PascalCase) — matches Prisma / PostgREST.

-- Business listings: filter by status, category, city
CREATE INDEX IF NOT EXISTS idx_business_status ON "Business" (status);
CREATE INDEX IF NOT EXISTS idx_business_category ON "Business" (category);
CREATE INDEX IF NOT EXISTS idx_business_city ON "Business" (city);

-- Merchant dashboard leads: filter by business, sort by newest first
CREATE INDEX IF NOT EXISTS idx_leads_business_id ON leads (business_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at DESC);

-- Composite index for getBusinessLeads(business_id ORDER BY created_at DESC)
CREATE INDEX IF NOT EXISTS idx_leads_business_id_created_at
  ON leads (business_id, created_at DESC);

-- Common category browse: active businesses in a category
CREATE INDEX IF NOT EXISTS idx_business_status_category
  ON "Business" (status, category);
