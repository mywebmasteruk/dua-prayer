-- DuaPrayer pending admin migrations (paste once in Supabase SQL Editor)
-- Project: itcoxbkhcwlsjpcwawyl
-- https://supabase.com/dashboard/project/itcoxbkhcwlsjpcwawyl/sql/new

-- ===== 20250608100000_site_settings.sql =====
-- Site-wide configurable settings (admin-managed, selective public read)

CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Public may read whitelisted keys (volunteer form embed URL)
DROP POLICY IF EXISTS site_settings_public_select ON public.site_settings;
CREATE POLICY site_settings_public_select ON public.site_settings
  FOR SELECT TO anon, authenticated
  USING (key IN ('volunteer_fillout_embed'));

-- Admins may read and write all settings
DROP POLICY IF EXISTS site_settings_admin_all ON public.site_settings;
CREATE POLICY site_settings_admin_all ON public.site_settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ===== 20250608120000_admin_rbac.sql =====
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

-- ===== 20250608130000_seed_volunteer_fillout_embed.sql =====
-- Default volunteer Fillout embed for local/testing (public form URL)
INSERT INTO public.site_settings (key, value)
VALUES ('volunteer_fillout_embed', 'https://forms.fillout.com/t/wHXBM6Gk1bus')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();

-- ===== 20250609120000_site_copy.sql =====
-- Editable site copy (admin-managed strings, selective public read)

INSERT INTO public.site_settings (key, value) VALUES
  ('copy.sidebar_tagline', 'Share duas, support one another, and grow together in faith.'),
  ('copy.footer_tagline', 'A nonprofit community platform for sharing duas and responding with ameen — free for the Ummah.'),
  ('copy.about_mission', 'DuaPrayer is a nonprofit community platform where people share prayer requests and respond with ameen. We build simple, welcoming technology so collective duas can travel further — without replacing scholars, counselors, or local communities.')
ON CONFLICT (key) DO NOTHING;

-- Public may read whitelisted copy keys
DROP POLICY IF EXISTS site_settings_public_select ON public.site_settings;
CREATE POLICY site_settings_public_select ON public.site_settings
  FOR SELECT TO anon, authenticated
  USING (key IN (
    'volunteer_fillout_embed',
    'copy.sidebar_tagline',
    'copy.footer_tagline',
    'copy.about_mission'
  ));

-- ===== 20250609130000_channels.sql =====
-- Channels: extend categories with description, status, and display order

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS categories_active_sort_idx ON public.categories (is_active, sort_order, name);

-- Seed descriptions for default channels (matches prior hardcoded copy)
UPDATE public.categories SET
  description = CASE name
    WHEN 'General' THEN 'Open duas from the wider community.'
    WHEN 'Health' THEN 'Prayers for healing, recovery, and wellbeing.'
    WHEN 'Family' THEN 'Duas for loved ones, marriage, and home.'
    WHEN 'Guidance' THEN 'Requests for clarity, direction, and wisdom.'
    WHEN 'Forgiveness' THEN 'Seeking mercy, repentance, and a clean heart.'
    WHEN 'Gratitude' THEN 'Sharing thanks and praise with the community.'
    WHEN 'Protection' THEN 'Prayers for safety, refuge, and steadfastness.'
    WHEN 'Community' THEN 'Collective support for the Ummah and neighbors.'
    ELSE COALESCE(NULLIF(description, ''), 'Duas and collective ameen in ' || lower(name) || '.')
  END,
  sort_order = CASE name
    WHEN 'General' THEN 10
    WHEN 'Health' THEN 20
    WHEN 'Family' THEN 30
    WHEN 'Guidance' THEN 40
    WHEN 'Forgiveness' THEN 50
    WHEN 'Gratitude' THEN 60
    WHEN 'Protection' THEN 70
    WHEN 'Community' THEN 80
    ELSE sort_order
  END,
  updated_at = now()
WHERE description = '' OR sort_order = 0;

-- Admins may manage channels (app also uses service role for admin writes)
DROP POLICY IF EXISTS categories_admin_all ON public.categories;
CREATE POLICY categories_admin_all ON public.categories
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ===== promote founding admin (optional, matches npm run setup:db) =====
INSERT INTO public.profiles (id, display_name, is_admin, admin_role, admin_permissions)
SELECT id, COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1)), true, 'admin', '{}'::jsonb
FROM auth.users WHERE lower(email) = lower('webmaster@duaprayer.com')
ON CONFLICT (id) DO UPDATE SET
  is_admin = true,
  admin_role = 'admin',
  admin_permissions = '{}'::jsonb,
  updated_at = now();
