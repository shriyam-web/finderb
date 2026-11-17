-- Runs only when an admin saves the storage switch.
-- Amazon S3 replaces a copied public address with its saved copy.
-- Cloudinary puts the original address back.
-- Addresses that were never copied stay as they are.

create or replace function public.apply_media_addresses(target text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  pairs_n integer := 0;
  businesses_n integer := 0;
  profiles_n integer := 0;
  categories_n integer := 0;
  places_n integer := 0;
  posts_n integer := 0;
  avatars_n integer := 0;
  videos_n integer := 0;
begin
  if target not in ('s3', 'cloudinary') then
    raise exception 'unsupported media target';
  end if;

  drop table if exists media_pairs;
  create temporary table media_pairs on commit drop as
  select source_url, variants->>'display' as display_url
  from public.media_assets
  where status = 'copied'
    and access = 'public'
    and coalesce(variants->>'display', '') like 'https://%'
    and variants->>'display' not like '%.svg'
    and variants->>'display' not like '%.svg?%';

  select count(*) into pairs_n from media_pairs;
  if pairs_n = 0 then
    return jsonb_build_object('target', target, 'pairs', 0);
  end if;

  if target = 's3' then
    update "Business" b
    set images = mapped.images
    from (
      select b2.id, array_agg(coalesce(s.display_url, u.photo) order by u.ord) as images
      from "Business" b2
      cross join lateral unnest(b2.images) with ordinality as u(photo, ord)
      left join media_pairs s on s.source_url = u.photo
      group by b2.id
      having bool_or(s.display_url is not null)
    ) mapped
    where b.id = mapped.id;
    get diagnostics businesses_n = row_count;

    update "Business" b
    set "profilePictureUrl" = s.display_url
    from media_pairs s
    where b."profilePictureUrl" = s.source_url;
    get diagnostics profiles_n = row_count;

    update categories c
    set symbol = s.display_url
    from media_pairs s
    where c.symbol = s.source_url;
    get diagnostics categories_n = row_count;

    update categories c
    set banner = s.display_url
    from media_pairs s
    where c.banner = s.source_url;

    update tourist_places t
    set image_url = s.display_url
    from media_pairs s
    where t.image_url = s.source_url;
    get diagnostics places_n = row_count;

    update blogs b set image_url = s.display_url from media_pairs s where b.image_url = s.source_url;
    update news n set image_url = s.display_url from media_pairs s where n.image_url = s.source_url;
    update movies m set poster_url = s.display_url from media_pairs s where m.poster_url = s.source_url;
    get diagnostics posts_n = row_count;

    update "User" u
    set "avatarUrl" = s.display_url
    from media_pairs s
    where u."avatarUrl" = s.source_url;
    get diagnostics avatars_n = row_count;

    update promotion_orders p
    set video_url = s.display_url
    from media_pairs s
    where p.video_url = s.source_url;
    get diagnostics videos_n = row_count;
  else
    update "Business" b
    set images = mapped.images
    from (
      select b2.id, array_agg(coalesce(s.source_url, u.photo) order by u.ord) as images
      from "Business" b2
      cross join lateral unnest(b2.images) with ordinality as u(photo, ord)
      left join media_pairs s on s.display_url = u.photo
      group by b2.id
      having bool_or(s.source_url is not null)
    ) mapped
    where b.id = mapped.id;
    get diagnostics businesses_n = row_count;

    update "Business" b
    set "profilePictureUrl" = s.source_url
    from media_pairs s
    where b."profilePictureUrl" = s.display_url;
    get diagnostics profiles_n = row_count;

    update categories c set symbol = s.source_url from media_pairs s where c.symbol = s.display_url;
    update categories c set banner = s.source_url from media_pairs s where c.banner = s.display_url;
    get diagnostics categories_n = row_count;

    update tourist_places t set image_url = s.source_url from media_pairs s where t.image_url = s.display_url;
    get diagnostics places_n = row_count;

    update blogs b set image_url = s.source_url from media_pairs s where b.image_url = s.display_url;
    update news n set image_url = s.source_url from media_pairs s where n.image_url = s.display_url;
    update movies m set poster_url = s.source_url from media_pairs s where m.poster_url = s.display_url;
    get diagnostics posts_n = row_count;

    update "User" u set "avatarUrl" = s.source_url from media_pairs s where u."avatarUrl" = s.display_url;
    get diagnostics avatars_n = row_count;

    update promotion_orders p set video_url = s.source_url from media_pairs s where p.video_url = s.display_url;
    get diagnostics videos_n = row_count;
  end if;

  return jsonb_build_object(
    'target', target,
    'pairs', pairs_n,
    'businesses', businesses_n,
    'profiles', profiles_n,
    'categories', categories_n,
    'places', places_n,
    'posts', posts_n,
    'avatars', avatars_n,
    'videos', videos_n
  );
end;
$$;

revoke all on function public.apply_media_addresses(text) from public;
revoke all on function public.apply_media_addresses(text) from anon;
revoke all on function public.apply_media_addresses(text) from authenticated;
grant execute on function public.apply_media_addresses(text) to service_role;
