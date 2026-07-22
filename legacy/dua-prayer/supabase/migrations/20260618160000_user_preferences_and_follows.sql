-- Personalization foundation (account-gated).
--
-- 1) Per-user preferences blob: { languages: text[], topics: int[],
--    onboarded_at: timestamptz }. Written via server actions (service role),
--    so no client column grant is needed (profiles client writes are locked).
alter table public.profiles
  add column if not exists preferences jsonb not null default '{}'::jsonb;

-- 2) Account-tied channel follows (replaces the old localStorage-only follows).
create table if not exists public.user_follows (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  channel_id bigint not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, channel_id)
);

create index if not exists user_follows_user_id_idx on public.user_follows(user_id);

alter table public.user_follows enable row level security;

-- Users may only see and manage their own follows.
drop policy if exists user_follows_select_own on public.user_follows;
create policy user_follows_select_own on public.user_follows
  for select to authenticated using (user_id = auth.uid());

drop policy if exists user_follows_insert_own on public.user_follows;
create policy user_follows_insert_own on public.user_follows
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists user_follows_delete_own on public.user_follows;
create policy user_follows_delete_own on public.user_follows
  for delete to authenticated using (user_id = auth.uid());
