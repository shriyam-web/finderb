-- FinderB Admin → Site Configurations. Public read, service-role write.
create table if not exists public.site_config (
  id text primary key,
  config jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_config enable row level security;

drop policy if exists site_config_public_read on public.site_config;
create policy site_config_public_read
  on public.site_config
  for select
  to anon, authenticated
  using (true);

insert into public.site_config (id, config)
values ('finderb', '{}'::jsonb)
on conflict (id) do nothing;
