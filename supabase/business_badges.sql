-- Public badges: admin overrides, and the moment a listing first went live.
-- Run once in the Supabase SQL editor, or: node scripts/apply-business-badges-sql.mjs

ALTER TABLE "Business"
  ADD COLUMN IF NOT EXISTS "badgeOverrides" JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE "Business"
  ADD COLUMN IF NOT EXISTS "listingLiveAt" TIMESTAMPTZ;

-- Existing live listings keep their original age. New approvals stamp listingLiveAt themselves.
UPDATE "Business"
SET "listingLiveAt" = "createdAt"
WHERE "listingLiveAt" IS NULL
  AND lower(status) = 'active'
  AND "createdAt" IS NOT NULL;

CREATE OR REPLACE FUNCTION public.badge_month_leaders(
  p_city text,
  p_category text,
  p_since timestamptz
)
RETURNS TABLE(business_id text, views bigint, leads bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH peers AS (
    SELECT b.id
    FROM "Business" b
    WHERE lower(b.status) = 'active'
      AND lower(btrim(coalesce(b.city, ''))) = lower(btrim(coalesce(p_city, '')))
      AND lower(btrim(coalesce(b.category, ''))) = lower(btrim(coalesce(p_category, '')))
  ),
  view_counts AS (
    SELECT v.business_id, count(*)::bigint AS views
    FROM profile_views v
    WHERE v.viewed_at >= p_since
    GROUP BY v.business_id
  ),
  lead_counts AS (
    SELECT l.business_id, count(*)::bigint AS leads
    FROM leads l
    WHERE l.created_at >= p_since
    GROUP BY l.business_id
  )
  SELECT
    peers.id,
    COALESCE(view_counts.views, 0),
    COALESCE(lead_counts.leads, 0)
  FROM peers
  LEFT JOIN view_counts ON view_counts.business_id = peers.id
  LEFT JOIN lead_counts ON lead_counts.business_id = peers.id;
$$;

REVOKE ALL ON FUNCTION public.badge_month_leaders(text, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.badge_month_leaders(text, text, timestamptz) TO service_role;
