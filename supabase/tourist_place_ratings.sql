-- Destination experience ratings (logged-in users).
-- Run in Supabase SQL editor if missing.

create table if not exists public.tourist_place_ratings (
  id uuid primary key default gen_random_uuid(),
  place_id text not null,
  user_key text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  vibes jsonb not null default '[]'::jsonb,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (place_id, user_key)
);

create index if not exists tourist_place_ratings_place_id_idx
  on public.tourist_place_ratings (place_id);

alter table public.tourist_place_ratings enable row level security;

drop policy if exists "tourist_place_ratings_select" on public.tourist_place_ratings;
create policy "tourist_place_ratings_select" on public.tourist_place_ratings
  for select using (true);

drop policy if exists "tourist_place_ratings_insert" on public.tourist_place_ratings;
create policy "tourist_place_ratings_insert" on public.tourist_place_ratings
  for insert with check (true);

drop policy if exists "tourist_place_ratings_update" on public.tourist_place_ratings;
create policy "tourist_place_ratings_update" on public.tourist_place_ratings
  for update using (true);
