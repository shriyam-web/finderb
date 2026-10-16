-- Lock down client (anon / authenticated) access to the public schema.
-- All writes and private reads go through the website server with the service role key,
-- so the browser and mobile app only get read access to published content.
-- New tables get no client access by default; grant SELECT explicitly if the app must read one.

begin;

do $$
declare t record;
begin
  for t in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')
  loop
    execute format('alter table public.%I enable row level security', t.relname);
  end loop;
end $$;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;

drop policy if exists "Allow all access to admin_lock_modal" on public.admin_lock_modal;
drop policy if exists "Allow all access to admin_whats_new" on public.admin_whats_new;
drop policy if exists "Allow all access to admin_whats_new_reads" on public.admin_whats_new_reads;
drop policy if exists "Allow all access to merchant_audit_logs" on public.merchant_audit_logs;
drop policy if exists "Allow all for authenticated users" on public.blogs;
drop policy if exists "Allow all access to broadcasts" on public.broadcasts;
drop policy if exists "Allow all access to movies" on public.movies;
drop policy if exists "Allow all access to news" on public.news;
drop policy if exists "Allow all access to tourist_places" on public.tourist_places;
drop policy if exists "tourist_place_merchants_anon_all" on public.tourist_place_merchants;
drop policy if exists "youtube_playlists_anon_all" on public.youtube_playlists;
drop policy if exists "youtube_videos_anon_all" on public.youtube_videos;
drop policy if exists "Businesses can manage their own jobs" on public.jobs;

-- Business: only active listings, only the columns shown on public profiles.
grant select (
  id, slug, "businessName", "displayName", category, location, city, state, about,
  "profilePictureUrl", images, "publicPhone", mobile, email, "workEmail", website,
  "whatsappNumber", "instagramUrl", "facebookUrl", "youtubeUrl", review, "reviewReply",
  rating, "googleRating", "isFinderBVerified", "hasVerifiedBadge", "discountRange", status,
  latitude, longitude, timings, "serviceCategory", keywords, "paymentModes",
  "businessAddress", "yearsInBusiness", "createdAt", "updatedAt",
  "emailVerified", "mobileVerified", "whatsappVerified"
) on public."Business" to anon, authenticated;
drop policy if exists business_public_read on public."Business";
create policy business_public_read on public."Business"
  for select to anon, authenticated using (status = 'Active');

grant select (
  id, title, type, location, salary, description, department, status, business_id,
  created_at, updated_at
) on public.jobs to anon, authenticated;

grant select on public.blogs to anon, authenticated;
drop policy if exists blogs_public_read on public.blogs;
create policy blogs_public_read on public.blogs
  for select to anon, authenticated using (status = 'published');

grant select on public.categories to anon, authenticated;
drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories
  for select to anon, authenticated using (true);

grant select (id, mode, message, until, started_at, updated_at)
  on public.site_runtime to anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array[
    'tourist_places', 'tourist_place_merchants', 'broadcasts', 'movies', 'news',
    'youtube_playlists', 'youtube_videos'
  ]
  loop
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('drop policy if exists %I on public.%I', t || '_public_read', t);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (%s)',
      t || '_public_read', t,
      case when t like 'youtube_%' then 'is_published' else 'true' end
    );
  end loop;
end $$;

commit;
