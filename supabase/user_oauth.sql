-- Optional OAuth profile fields for User accounts (Google, Apple, GitHub, etc.)
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "authProvider" TEXT,
  ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "supabaseAuthId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_supabase_auth_id ON "User"("supabaseAuthId")
  WHERE "supabaseAuthId" IS NOT NULL;
