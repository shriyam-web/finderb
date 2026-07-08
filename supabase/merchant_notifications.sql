-- Merchant event notifications (new reviews, etc.).
-- Run once in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS merchant_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text NOT NULL REFERENCES "Business"(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text,
  body text NOT NULL,
  metadata jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_merchant_notifications_business_created
  ON merchant_notifications (business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_merchant_notifications_business_unread
  ON merchant_notifications (business_id)
  WHERE read_at IS NULL;

ALTER TABLE merchant_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "merchant_notifications_deny_anon"
  ON merchant_notifications
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);
