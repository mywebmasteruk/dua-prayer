-- Admin RBAC: roles and granular permission overrides on profiles

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_role_type') THEN
    CREATE TYPE public.admin_role_type AS ENUM ('admin', 'moderator');
  END IF;
END
$$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admin_role public.admin_role_type,
  ADD COLUMN IF NOT EXISTS admin_permissions jsonb NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS profiles_is_admin_idx ON public.profiles (is_admin) WHERE is_admin = true;

COMMENT ON COLUMN public.profiles.admin_role IS 'RBAC preset for restricted admins';
COMMENT ON COLUMN public.profiles.admin_permissions IS 'Optional overrides: true grants, false revokes relative to admin_role preset';

-- Admins with manage_users may read all profiles (app enforces permission; RLS allows any is_admin for now)
DROP POLICY IF EXISTS profiles_admin_update ON public.profiles;
CREATE POLICY profiles_admin_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
