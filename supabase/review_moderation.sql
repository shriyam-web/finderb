-- Review moderation index + flag status for FinderB admins.
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS review_moderation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text NOT NULL REFERENCES "Business"(id) ON DELETE CASCADE,
  review_id text NOT NULL,
  business_name text,
  author_name text,
  display_name text,
  content text,
  rating int,
  anonymous boolean NOT NULL DEFAULT false,
  anonymous_reason text,
  anonymity_status text NOT NULL DEFAULT 'pending',
  hidden boolean NOT NULL DEFAULT false,
  deleted boolean NOT NULL DEFAULT false,
  admin_note text,
  anonymity_reviewed_at timestamptz,
  anonymity_reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, review_id)
);

CREATE INDEX IF NOT EXISTS idx_review_moderation_anonymous
  ON review_moderation (anonymity_status, created_at DESC)
  WHERE anonymous AND NOT deleted;

CREATE INDEX IF NOT EXISTS idx_review_moderation_review_id
  ON review_moderation (review_id);

CREATE INDEX IF NOT EXISTS idx_review_moderation_business
  ON review_moderation (business_id, created_at DESC);

ALTER TABLE review_moderation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "review_moderation_deny_anon" ON review_moderation;
CREATE POLICY "review_moderation_deny_anon"
  ON review_moderation
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

ALTER TABLE review_reports
  ADD COLUMN IF NOT EXISTS reporter_type text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS admin_note text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid;

UPDATE review_reports
SET reporter_type = CASE
  WHEN reporter_key LIKE 'business:%' THEN 'business'
  ELSE 'user'
END
WHERE reporter_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_review_reports_type_status
  ON review_reports (reporter_type, status, created_at DESC);
