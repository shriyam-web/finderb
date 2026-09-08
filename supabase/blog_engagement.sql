-- Blog ratings + comments for FinderB app / site engagement.
-- Run in Supabase SQL editor if these tables are not present yet.

create table if not exists public.blog_ratings (
  id uuid primary key default gen_random_uuid(),
  blog_id text not null,
  user_key text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (blog_id, user_key)
);

create table if not exists public.blog_comments (
  id uuid primary key default gen_random_uuid(),
  blog_id text not null,
  user_key text,
  author_name text not null,
  content text not null,
  rating integer check (rating is null or (rating >= 1 and rating <= 5)),
  created_at timestamptz not null default now()
);

create index if not exists blog_ratings_blog_id_idx on public.blog_ratings (blog_id);
create index if not exists blog_comments_blog_id_idx on public.blog_comments (blog_id, created_at desc);

alter table public.blog_ratings enable row level security;
alter table public.blog_comments enable row level security;

drop policy if exists "blog_ratings_select" on public.blog_ratings;
create policy "blog_ratings_select" on public.blog_ratings
  for select using (true);

drop policy if exists "blog_ratings_insert" on public.blog_ratings;
create policy "blog_ratings_insert" on public.blog_ratings
  for insert with check (true);

drop policy if exists "blog_ratings_update" on public.blog_ratings;
create policy "blog_ratings_update" on public.blog_ratings
  for update using (true);

drop policy if exists "blog_comments_select" on public.blog_comments;
create policy "blog_comments_select" on public.blog_comments
  for select using (true);

drop policy if exists "blog_comments_insert" on public.blog_comments;
create policy "blog_comments_insert" on public.blog_comments
  for insert with check (true);
