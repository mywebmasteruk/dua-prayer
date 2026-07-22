-- Bookmarks: a user's privately saved duas.
create table if not exists public.bookmarks (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  dua_id bigint not null references public.duas(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, dua_id)
);

create index if not exists bookmarks_user_created_idx
  on public.bookmarks (user_id, created_at desc);

-- In-app notifications. Rows are self-contained (denormalized title/body/href)
-- so rendering needs no joins. `type` groups them for icons/filtering.
create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

-- Fast unread-count lookups for the nav badge.
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id)
  where read_at is null;

-- All access is server-side via the service-role client (see app/actions/*),
-- which bypasses RLS. Enable RLS with no policies so anon/authenticated
-- PostgREST roles cannot read another user's bookmarks or notifications.
alter table public.bookmarks enable row level security;
alter table public.notifications enable row level security;
