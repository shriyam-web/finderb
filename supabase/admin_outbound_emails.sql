-- Sent mail from the admin Broadcast Email tab.
-- Run once in the Supabase SQL editor. Safe to re-run.

CREATE TABLE IF NOT EXISTS admin_outbound_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  to_emails TEXT[] NOT NULL DEFAULT '{}',
  cc_emails TEXT[] NOT NULL DEFAULT '{}',
  bcc_emails TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_outbound_emails_created
  ON admin_outbound_emails (created_at DESC);

ALTER TABLE admin_outbound_emails ENABLE ROW LEVEL SECURITY;
