-- Links a FinderB user account to a business they own or manage.
-- Used so owners cannot review their own listing after switching portals.
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS business_user_links (
  user_id text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  business_id text NOT NULL REFERENCES "Business"(id) ON DELETE CASCADE,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_business_user_links_business
  ON business_user_links (business_id);

ALTER TABLE business_user_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_user_links_deny_anon" ON business_user_links;
CREATE POLICY "business_user_links_deny_anon"
  ON business_user_links
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);
