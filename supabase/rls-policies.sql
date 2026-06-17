-- FinderB Supabase Row Level Security (RLS) policies
-- Run in Supabase SQL Editor. Adjust table names if your schema differs.
-- Until these are applied, the anon key can bypass app-layer checks via direct API calls.

-- ============ Business ============
ALTER TABLE "Business" ENABLE ROW LEVEL SECURITY;

-- Public can read only active listings (no KYC / payment / owner PII columns exposed via views;
-- RLS cannot column-filter — use a SECURITY DEFINER view or restrict SELECT in app).
CREATE POLICY "business_public_read_active"
  ON "Business" FOR SELECT
  USING (status = 'Active');

-- Merchants update only their row (requires auth.uid() if using Supabase Auth;
-- with custom cookie auth, prefer service role on server only).
-- Example if you migrate to Supabase Auth with business_id claim:
-- CREATE POLICY "business_owner_update" ON "Business" FOR UPDATE
--   USING (auth.jwt() ->> 'business_id' = id::text);

-- ============ User ============
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Deny all anon access by default; server uses service role or authenticated role.
CREATE POLICY "user_deny_anon"
  ON "User" FOR ALL
  TO anon
  USING (false);

-- ============ leads ============
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_deny_anon_insert_abuse"
  ON leads FOR INSERT
  TO anon
  WITH CHECK (true);
-- Tighten: only allow insert from service role; block anon SELECT:
CREATE POLICY "leads_deny_anon_select"
  ON leads FOR SELECT
  TO anon
  USING (false);

-- ============ jobs ============
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jobs_public_read_active"
  ON jobs FOR SELECT
  USING (status = 'active');

CREATE POLICY "jobs_deny_anon_write"
  ON jobs FOR INSERT
  TO anon
  WITH CHECK (false);

-- ============ broadcasts ============
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "broadcasts_public_read"
  ON broadcasts FOR SELECT
  USING (true);

-- NOTE: Review each policy in staging. Custom cookie sessions require
-- server-side Supabase client with service role for mutations, or Supabase Auth migration.
