-- Public reports of a business listing. Service role is the only writer.
-- Run once in the Supabase SQL editor if the table is missing.

create table if not exists business_reports (
  id uuid primary key default gen_random_uuid(),
  business_id text not null,
  business_name text not null,
  business_slug text,
  business_city text,
  reporter_user_id text not null,
  reporter_name text,
  reporter_email text,
  reason text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists business_reports_one_per_user
  on business_reports (business_id, reporter_user_id);

create index if not exists business_reports_created_idx
  on business_reports (created_at desc);

alter table business_reports enable row level security;
