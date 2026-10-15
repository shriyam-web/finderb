-- 90-day merchant account deletion. Public page goes down immediately;
-- complete scrub happens after deletionScheduledAt.

ALTER TABLE "Business"
  ADD COLUMN IF NOT EXISTS "deletionScheduledAt" TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_business_deletion_scheduled_at
  ON "Business" ("deletionScheduledAt")
  WHERE "deletionScheduledAt" IS NOT NULL;
