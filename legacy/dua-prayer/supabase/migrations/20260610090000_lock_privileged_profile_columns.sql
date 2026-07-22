-- SECURITY: prevent privilege escalation via client-side profile updates.
--
-- The profiles_update_own RLS policy restricts WHICH ROWS a user can update,
-- but not WHICH COLUMNS. Privileged flags (is_admin, admin_role,
-- admin_permissions, account_status, member_role, reviewed_*) live on
-- profiles, so any authenticated user could grant themselves admin with a
-- direct PostgREST call using the public anon key.
--
-- All legitimate writes to these columns go through server actions using the
-- service role, which is unaffected by these grants. The only field a user
-- may self-edit from the client is display_name.

REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM authenticated;

GRANT UPDATE (display_name, updated_at) ON public.profiles TO authenticated;
