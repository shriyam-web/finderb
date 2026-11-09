-- Promote Your Business Online. Separate from merchant subscriptions and leads.
-- Re-running this file does not overwrite package prices an admin has changed.

create table if not exists promotion_packages (
  id text primary key,
  name text not null,
  duration_days integer not null,
  coverage_label text not null,
  price_inr integer not null,
  reference_inr integer not null,
  reach_label text not null,
  views_label text not null,
  visits_label text not null,
  popular boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists business_verifications (
  id text primary key,
  business_id text not null references "Business"(id) on delete cascade,
  status text not null,
  shop_photo_url text,
  shop_photo_public_id text,
  shop_photo_format text,
  latitude double precision,
  longitude double precision,
  accuracy_m double precision,
  document_type text,
  document_urls jsonb not null default '[]'::jsonb,
  declaration_accepted boolean not null default false,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewer_admin_id text,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_business_verifications_business
  on business_verifications (business_id, created_at desc);

create table if not exists promotion_orders (
  id text primary key,
  business_id text not null references "Business"(id) on delete cascade,
  package_id text not null,
  package_snapshot jsonb not null,
  video_url text,
  video_public_id text,
  video_duration_sec numeric,
  video_width integer,
  video_height integer,
  video_format text,
  target_pincode text,
  target_area text,
  target_coverage text,
  amount_inr integer not null,
  payment_status text not null default 'pending',
  campaign_status text not null default 'payment_pending',
  razorpay_order_id text,
  razorpay_payment_id text,
  campaign_started_at timestamptz,
  campaign_ended_at timestamptz,
  actual_reach integer,
  actual_views integer,
  actual_visits integer,
  rejection_reason text,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_promotion_orders_razorpay_order
  on promotion_orders (razorpay_order_id) where razorpay_order_id is not null;
create unique index if not exists idx_promotion_orders_razorpay_payment
  on promotion_orders (razorpay_payment_id) where razorpay_payment_id is not null;
create index if not exists idx_promotion_orders_business
  on promotion_orders (business_id, created_at desc);
create index if not exists idx_promotion_orders_status
  on promotion_orders (campaign_status, payment_status);

create table if not exists promotion_audit (
  id bigserial primary key,
  order_id text,
  verification_id text,
  business_id text,
  actor_admin_id text,
  action text not null,
  from_status text,
  to_status text,
  note text,
  metrics jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_promotion_audit_order on promotion_audit (order_id, created_at desc);

insert into promotion_packages (
  id, name, duration_days, coverage_label, price_inr, reference_inr,
  reach_label, views_label, visits_label, popular, active, sort_order
) values
  ('starter', 'Starter Boost', 5, '5–8 KM', 999, 5999, '6,000–10,000 people', '10,000+ views', '300+ profile visits', false, true, 1),
  ('growth', 'Growth Booster', 10, '15–20 KM / City', 1999, 9999, '18,000–28,000 people', '25,000+ views', '1,000+ profile visits', true, true, 2),
  ('mega', 'Mega Booster', 15, 'District / Regional', 2999, 17999, '45,000–70,000 people', '60,000+ views', '2,500+ profile visits', false, true, 3)
on conflict (id) do nothing;

alter table promotion_packages enable row level security;
alter table business_verifications enable row level security;
alter table promotion_orders enable row level security;
alter table promotion_audit enable row level security;

alter table promotion_orders add column if not exists video_format text;
alter table promotion_orders add column if not exists ad_review_status text;
alter table promotion_orders add column if not exists ad_review_reason text;
alter table promotion_orders add column if not exists ad_reviewed_at timestamptz;
alter table business_verifications add column if not exists shop_photo_public_id text;
alter table business_verifications add column if not exists shop_photo_format text;

create table if not exists promotion_custom_requests (
  id text primary key,
  business_id text not null references "Business"(id) on delete cascade,
  budget_inr integer not null,
  duration_days integer not null,
  coverage text not null,
  pincode text not null,
  area text not null,
  goal text not null,
  phone text not null,
  note text,
  status text not null default 'received',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_promotion_custom_business
  on promotion_custom_requests (business_id, created_at desc);
create index if not exists idx_promotion_custom_status
  on promotion_custom_requests (status, created_at desc);

alter table promotion_custom_requests enable row level security;
