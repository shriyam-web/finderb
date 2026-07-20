-- Admin-managed YouTube playlists + videos for the homepage Tutorials section.
-- Run in Supabase SQL editor after deploying application code.
--
-- FinderB Admin uses the browser anon/publishable key for content CRUD
-- (same pattern as movies/blogs), so anon needs read/write on these tables.
-- The public site still filters is_published = true in application queries.

CREATE TABLE IF NOT EXISTS youtube_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS youtube_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES youtube_playlists(id) ON DELETE CASCADE,
  youtube_video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  topic TEXT,
  thumbnail_url TEXT NOT NULL,
  watch_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_youtube_playlists_published_sort
  ON youtube_playlists (is_published, sort_order ASC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_youtube_videos_playlist_sort
  ON youtube_videos (playlist_id, is_published, sort_order ASC, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_youtube_videos_playlist_video_unique
  ON youtube_videos (playlist_id, youtube_video_id);

COMMENT ON TABLE youtube_playlists IS 'Curated YouTube playlists shown on the homepage Tutorials section';
COMMENT ON TABLE youtube_videos IS 'Videos under an admin playlist; paste YouTube watch/shorts links in admin';

ALTER TABLE youtube_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_videos ENABLE ROW LEVEL SECURITY;

-- Drop older restrictive policies if re-running this script
DROP POLICY IF EXISTS youtube_playlists_public_read_published ON youtube_playlists;
DROP POLICY IF EXISTS youtube_videos_public_read_published ON youtube_videos;
DROP POLICY IF EXISTS youtube_playlists_deny_anon_write ON youtube_playlists;
DROP POLICY IF EXISTS youtube_videos_deny_anon_write ON youtube_videos;
DROP POLICY IF EXISTS youtube_playlists_anon_all ON youtube_playlists;
DROP POLICY IF EXISTS youtube_videos_anon_all ON youtube_videos;

CREATE POLICY youtube_playlists_anon_all
  ON youtube_playlists FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY youtube_videos_anon_all
  ON youtube_videos FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
