-- Admin sign-in audit trail (run in Supabase SQL editor)
-- Safe to re-run: adds missing columns if the table was created earlier without them.

CREATE TABLE IF NOT EXISTS admin_login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE admin_login_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE admin_login_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE admin_login_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_admin_login_logs_admin_id ON admin_login_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_login_logs_created_at ON admin_login_logs(created_at DESC);

-- Set controller role on the account that may view all logs, e.g.:
-- UPDATE admins SET role = 'controller' WHERE email = 'controller.dev@finderb.com';
