-- Tab-level access, OTP verification, and 48-hour invite expiry for business team members.

ALTER TABLE business_team_members
  ADD COLUMN IF NOT EXISTS tab_access jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE business_team_members
  ADD COLUMN IF NOT EXISTS contact_verified_at timestamptz;

ALTER TABLE business_team_members
  DROP CONSTRAINT IF EXISTS business_team_members_status_check;

ALTER TABLE business_team_members
  ADD CONSTRAINT business_team_members_status_check
  CHECK (status IN ('pending', 'active', 'revoked', 'expired'));
