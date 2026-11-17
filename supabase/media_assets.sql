-- Side mapping for a later Cloudinary copy. Existing photo columns stay unchanged.
-- Safe to re-run. Does not update or delete any current row.

create table if not exists public.media_assets (
  id text primary key,
  source_url text not null,
  business_id text,
  role text not null,
  access text not null default 'public',
  provider text not null default 'cloudinary',
  bucket text,
  object_key text,
  content_type text,
  bytes integer,
  width integer,
  height integer,
  variants jsonb not null default '{}'::jsonb,
  status text not null default 'source',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists media_assets_source_url_key
  on public.media_assets (source_url);

create index if not exists media_assets_business_idx
  on public.media_assets (business_id);

alter table public.media_assets enable row level security;
