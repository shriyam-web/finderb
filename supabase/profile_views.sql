-- Profile view analytics for merchant dashboard KPIs.
-- Run once in Supabase SQL Editor (Dashboard → SQL → New query).

CREATE TABLE IF NOT EXISTS profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text NOT NULL REFERENCES "Business"(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  session_hash text
);

CREATE INDEX IF NOT EXISTS idx_profile_views_business_viewed
  ON profile_views (business_id, viewed_at DESC);

ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Server actions use the service role key for reads/writes.
CREATE POLICY "profile_views_deny_anon"
  ON profile_views
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);
