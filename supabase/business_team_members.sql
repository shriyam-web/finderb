-- Extra people who can sign in to the same FinderB Business profile.
-- Pending until they open the invite and set a password.

CREATE TABLE IF NOT EXISTS business_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text NOT NULL REFERENCES "Business"(id) ON DELETE CASCADE,
  email text,
  mobile text,
  password_hash text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked', 'expired')),
  invite_token_hash text NOT NULL,
  invite_expires_at timestamptz NOT NULL,
  last_invite_sent_at timestamptz,
  accepted_at timestamptz,
  contact_verified_at timestamptz,
  tab_access jsonb NOT NULL DEFAULT '{}'::jsonb,
  invited_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_team_members_contact_check CHECK (
    (email IS NOT NULL AND btrim(email) <> '')
    OR (mobile IS NOT NULL AND btrim(mobile) <> '')
  )
);

CREATE INDEX IF NOT EXISTS idx_business_team_members_business
  ON business_team_members (business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_business_team_members_token
  ON business_team_members (invite_token_hash);

CREATE UNIQUE INDEX IF NOT EXISTS business_team_members_email_unique
  ON business_team_members (lower(email))
  WHERE email IS NOT NULL AND status IN ('pending', 'active');

CREATE UNIQUE INDEX IF NOT EXISTS business_team_members_mobile_unique
  ON business_team_members (mobile)
  WHERE mobile IS NOT NULL AND status IN ('pending', 'active');

ALTER TABLE business_team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_team_members_deny_anon" ON business_team_members;
CREATE POLICY "business_team_members_deny_anon"
  ON business_team_members
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);
