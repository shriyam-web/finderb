-- Cashfree business verification (PAN, Udyam, optional GSTIN).
-- Stores the result only. The full PAN is never written.
-- Safe to re-run.

ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "kycMethod" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "kycLegalName" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "kycVerifiedAt" TIMESTAMPTZ;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "kycReferenceId" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "panMasked" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "udyamNumber" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "gstin" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "gstLegalName" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "gstStatus" TEXT;
