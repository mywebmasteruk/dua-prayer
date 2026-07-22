alter table public.dua_bots
  add column if not exists auto_categorize boolean not null default false;
