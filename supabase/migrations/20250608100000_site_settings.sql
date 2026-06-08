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
