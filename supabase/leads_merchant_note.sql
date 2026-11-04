-- Private note a merchant keeps on a lead. Safe to re-run.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS merchant_note text;
