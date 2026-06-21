alter table public.dua_bots
  add column if not exists web_search_enabled boolean not null default false;
