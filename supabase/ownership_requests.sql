-- Owner-access requests and private user notifications.
-- Run in the Supabase SQL editor for the FinderB project.

CREATE TABLE IF NOT EXISTS business_ownership_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id TEXT NOT NULL,
  user_id TEXT,
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  requester_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  reviewed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ownership_requests_status
  ON business_ownership_requests (status, created_at DESC);

ALTER TABLE business_ownership_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ownership_requests_deny_anon" ON business_ownership_requests;
CREATE POLICY "ownership_requests_deny_anon"
  ON business_ownership_requests FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE TABLE IF NOT EXISTS user_direct_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  cta_url TEXT,
  cta_label TEXT,
  show_datetime BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_direct_notifications_user
  ON user_direct_notifications (user_id, created_at DESC);

ALTER TABLE user_direct_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_direct_notifications_deny_anon" ON user_direct_notifications;
CREATE POLICY "user_direct_notifications_deny_anon"
  ON user_direct_notifications FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);
