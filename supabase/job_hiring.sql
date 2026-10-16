-- Job applications, HR contact, CV storage, and job reports.
-- Run once in the Supabase SQL editor. Service role is the only writer.

alter table "Business" add column if not exists hr_email text;
alter table "Business" add column if not exists hr_mobile text;

create table if not exists job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id text not null,
  business_id text not null,
  user_id text,
  full_name text not null,
  email text not null,
  phone text not null,
  message text,
  cv_path text,
  cv_name text,
  cv_kind text,
  status text not null default 'received',
  created_at timestamptz not null default now()
);

create index if not exists job_applications_job_idx on job_applications (job_id, created_at desc);

create table if not exists job_reports (
  id uuid primary key default gen_random_uuid(),
  job_id text not null,
  business_id text,
  job_title text,
  reporter_user_id text,
  reason text not null,
  status text not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now()
);

alter table job_applications enable row level security;
alter table job_reports enable row level security;

insert into storage.buckets (id, name, public)
values ('job-cvs', 'job-cvs', false)
on conflict (id) do nothing;
