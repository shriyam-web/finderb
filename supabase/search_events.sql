-- Anonymous search analytics for homepage trending and discovery insights.
-- Run once in Supabase SQL Editor (Dashboard → SQL → New query).

CREATE TABLE IF NOT EXISTS search_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  normalized_query text NOT NULL,
  searched_at timestamptz NOT NULL DEFAULT now(),
  session_hash text
);

CREATE INDEX IF NOT EXISTS idx_search_events_normalized_searched
  ON search_events (normalized_query, searched_at DESC);

CREATE INDEX IF NOT EXISTS idx_search_events_searched_at
  ON search_events (searched_at DESC);

ALTER TABLE search_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "search_events_deny_anon"
  ON search_events
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);
