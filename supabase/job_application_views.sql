-- Unseen job applications: null until the business opens that job's applications.
-- Run in the Supabase SQL editor for the FinderB project.

ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS merchant_viewed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS job_applications_unseen_idx
  ON job_applications (business_id, job_id)
  WHERE merchant_viewed_at IS NULL;
