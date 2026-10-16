-- Targeted sends, a hold queue, and scheduled broadcasts.
-- Run once in the Supabase SQL editor.

ALTER TABLE broadcasts
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent',
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS target_user_id TEXT,
  ADD COLUMN IF NOT EXISTS target_business_id TEXT,
  ADD COLUMN IF NOT EXISTS target_label TEXT,
  ADD COLUMN IF NOT EXISTS recipient_count INTEGER;

CREATE INDEX IF NOT EXISTS idx_broadcasts_due
  ON broadcasts (scheduled_at)
  WHERE push_sent_at IS NULL;
