-- Separate lead source badges from merchant pipeline status.
-- Safe to re-run.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS source text;

UPDATE leads
SET source = CASE
  WHEN status IN (
    'Generated on your profile',
    'In your category',
    'Popular in your category',
    'Direct Lead'
  ) THEN status
  ELSE source
END
WHERE source IS NULL;

UPDATE leads
SET status = 'To be contacted'
WHERE status IN (
  'New',
  'New Lead',
  'Generated on your profile',
  'In your category',
  'Popular in your category',
  'Direct Lead'
);

UPDATE leads
SET source = 'Popular in your category'
WHERE source = 'In your category';

CREATE INDEX IF NOT EXISTS idx_leads_source ON leads (source);
