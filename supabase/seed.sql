-- LOCAL DEVELOPMENT ONLY.
--
-- This file is applied by the Supabase CLI on `supabase start` / `supabase db
-- reset` AFTER all migrations. It is never applied to a hosted Supabase project
-- (`supabase db push` only pushes migrations), so it cannot affect production.
--
-- Why this exists:
-- The repo's migrations were written against a hosted Supabase project whose
-- API roles (anon/authenticated/service_role) receive full table DML by default
-- (SELECT/INSERT/UPDATE/DELETE), with row access then gated by RLS policies.
-- The local Supabase CLI stack used here does NOT grant table DML to those
-- roles by default (only TRUNCATE/REFERENCES/TRIGGER/MAINTAIN), so every
-- RLS-backed read/write returns "permission denied for table ...".
--
-- The one migration that REVOKEs DML from anon on `public.profiles`
-- (20260610090000_lock_privileged_profile_columns.sql) only makes sense if the
-- baseline granted that DML, confirming the intended baseline. This seed
-- restores that hosted baseline for local dev, then re-applies the intentional
-- profiles lock-down so the security model matches production.

-- 1) Restore hosted baseline: grant table DML + sequence usage to API roles.
grant select, insert, update, delete on all tables in schema public
  to anon, authenticated, service_role;
grant usage, select on all sequences in schema public
  to anon, authenticated, service_role;

-- Make future tables (if any are created interactively) inherit the same.
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;

-- 2) Re-apply the intentional privilege lock-down from
--    20260610090000_lock_privileged_profile_columns.sql (privilege escalation
--    guard). Writes to privileged profile columns must go through server
--    actions using the service role only.
revoke insert, update, delete on public.profiles from anon;
revoke insert, update, delete on public.profiles from authenticated;
grant update (display_name, updated_at) on public.profiles to authenticated;
