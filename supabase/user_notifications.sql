-- User-app notifications: Expo push tokens + mark admin broadcasts as pushed.
-- Run in Supabase SQL Editor (same project as FinderB website / admin).

CREATE TABLE IF NOT EXISTS user_push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  platform TEXT,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON user_push_tokens (user_id);

ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_push_tokens_deny_anon" ON user_push_tokens;
CREATE POLICY "user_push_tokens_deny_anon"
  ON user_push_tokens FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

ALTER TABLE broadcasts
  ADD COLUMN IF NOT EXISTS push_sent_at TIMESTAMPTZ;

ALTER TABLE broadcasts
  ADD COLUMN IF NOT EXISTS cta_url TEXT,
  ADD COLUMN IF NOT EXISTS cta_label TEXT,
  ADD COLUMN IF NOT EXISTS show_datetime BOOLEAN DEFAULT true;

CREATE TABLE IF NOT EXISTS broadcast_reads (
  broadcast_id UUID NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
  reader_id TEXT NOT NULL,
  reader_type TEXT NOT NULL DEFAULT 'user',
  read_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (broadcast_id, reader_type, reader_id)
);

CREATE INDEX IF NOT EXISTS idx_broadcast_reads_broadcast ON broadcast_reads (broadcast_id);

ALTER TABLE broadcast_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "broadcast_reads_deny_anon" ON broadcast_reads;
CREATE POLICY "broadcast_reads_deny_anon"
  ON broadcast_reads FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);
