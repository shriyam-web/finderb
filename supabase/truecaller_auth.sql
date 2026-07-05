-- Truecaller one-tap login for User accounts (Android mobile web)
-- Run in Supabase → SQL Editor after deploying the Truecaller integration.

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS "truecallerUserId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_phone ON "User"(phone)
  WHERE phone IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_truecaller_user_id ON "User"("truecallerUserId")
  WHERE "truecallerUserId" IS NOT NULL;

CREATE TABLE IF NOT EXISTS truecaller_auth_requests (
  "requestId" TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending',
  "userId" TEXT,
  "errorMessage" TEXT,
  "redirectPath" TEXT NOT NULL DEFAULT '/dashboard',
  "isNewUser" BOOLEAN,
  "suggestedLoginPath" TEXT,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_truecaller_auth_expires ON truecaller_auth_requests("expiresAt");
