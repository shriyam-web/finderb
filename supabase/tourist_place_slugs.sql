-- SEO-friendly tourist place URLs
-- Run in Supabase SQL editor after deploying application code.

ALTER TABLE tourist_places ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tourist_places_slug_unique
  ON tourist_places (slug)
  WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tourist_places_slug_lookup
  ON tourist_places (slug);

COMMENT ON COLUMN tourist_places.slug IS 'SEO URL slug, e.g. taj-mahal-agra';

-- After deploying app code, backfill all rows:
--   npm run backfill:tourist-slugs:dry   (preview)
--   npm run backfill:tourist-slugs       (apply)
