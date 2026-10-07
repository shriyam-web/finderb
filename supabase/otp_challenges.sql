-- One-time OTP hashes. The plaintext code is never stored.
-- Rows are deleted when the code is used or when expires_at has passed.
-- RLS is on with no policies, so only the service role can read or write.

create table if not exists public.otp_challenges (
  id uuid primary key default gen_random_uuid(),
  purpose text not null,
  subject text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (purpose, subject)
);

create index if not exists otp_challenges_expires_at_idx
  on public.otp_challenges (expires_at);

alter table public.otp_challenges enable row level security;

-- send_count caps resends per recipient; attempts caps wrong guesses per code.
alter table public.otp_challenges
  add column if not exists send_count int not null default 1;
alter table public.otp_challenges
  add column if not exists attempts int not null default 0;

alter table public."Business"
  add column if not exists "emailVerified" boolean not null default false;
