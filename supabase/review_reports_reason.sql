-- review_reports.sql was applied before the reason column existed; reporting fails without it.
alter table public.review_reports add column if not exists reason text;
notify pgrst, 'reload schema';
