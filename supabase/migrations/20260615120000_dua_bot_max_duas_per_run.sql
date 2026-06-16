alter table public.dua_bots
  add column if not exists max_duas_per_run integer not null default 3
  check (max_duas_per_run between 1 and 10);
