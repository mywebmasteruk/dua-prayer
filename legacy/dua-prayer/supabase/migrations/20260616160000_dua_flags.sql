-- Per-user flags so a registered user can unflag only the flag they made.
-- `duas.flagged` stays as the denormalized "needs review" boolean (true while any
-- flag exists); admins can clear it (and all flags) outright.
create table if not exists public.dua_flags (
  id bigint generated always as identity primary key,
  dua_id bigint not null references public.duas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (dua_id, user_id)
);

create index if not exists dua_flags_dua_id_idx on public.dua_flags (dua_id);
create index if not exists dua_flags_user_id_idx on public.dua_flags (user_id);

-- All access is server-side via the service-role client (see app/actions/duas.ts),
-- which bypasses RLS. Enable RLS with no policies so the anon/authenticated
-- PostgREST roles are denied direct access to who-flagged-what.
alter table public.dua_flags enable row level security;
