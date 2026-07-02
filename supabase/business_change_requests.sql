-- Merchant profile change requests (category, legal name, etc.) — reviewed from admin panel later.
-- Safe to re-run.
-- Note: "Business".id is TEXT in this project (not UUID).

CREATE TABLE IF NOT EXISTS business_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL REFERENCES "Business"(id) ON DELETE CASCADE,
  field TEXT NOT NULL DEFAULT 'category',
  current_value TEXT NOT NULL,
  requested_value TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  merchant_note TEXT,
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID
);

CREATE INDEX IF NOT EXISTS idx_bcr_business_status ON business_change_requests(business_id, status);
CREATE INDEX IF NOT EXISTS idx_bcr_pending_field ON business_change_requests(field, status)
  WHERE status = 'pending';
