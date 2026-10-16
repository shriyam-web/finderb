-- Current owner has 48 hours to answer an ownership claim.
-- Approved transfers keep the previous login so an admin can reverse them for 15 days.
-- Run in the Supabase SQL editor for the FinderB project.

ALTER TABLE business_ownership_requests
  ADD COLUMN IF NOT EXISTS owner_decision TEXT,
  ADD COLUMN IF NOT EXISTS owner_note TEXT,
  ADD COLUMN IF NOT EXISTS owner_decided_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS owner_deadline_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS previous_email TEXT,
  ADD COLUMN IF NOT EXISTS previous_work_email TEXT,
  ADD COLUMN IF NOT EXISTS previous_mobile TEXT,
  ADD COLUMN IF NOT EXISTS previous_password TEXT,
  ADD COLUMN IF NOT EXISTS previous_email_verified BOOLEAN,
  ADD COLUMN IF NOT EXISTS previous_mobile_verified BOOLEAN,
  ADD COLUMN IF NOT EXISTS transferred_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reversible_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reversed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reversed_by TEXT;

CREATE INDEX IF NOT EXISTS idx_ownership_requests_reversible
  ON business_ownership_requests (reversible_until DESC)
  WHERE status = 'approved' AND reversed_at IS NULL;
