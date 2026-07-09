-- Review reports from logged-in users and businesses.
-- Run once in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS review_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text NOT NULL REFERENCES "Business"(id) ON DELETE CASCADE,
  review_id text NOT NULL,
  reporter_key text NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, review_id, reporter_key)
);

CREATE INDEX IF NOT EXISTS idx_review_reports_business_created
  ON review_reports (business_id, created_at DESC);

ALTER TABLE review_reports
  ADD COLUMN IF NOT EXISTS reason text;

ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "review_reports_deny_anon"
  ON review_reports
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);
