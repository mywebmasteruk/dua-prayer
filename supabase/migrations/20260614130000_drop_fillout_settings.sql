-- Fillout has been replaced by the built-in admin form builder. Remove the
-- stored Fillout embed settings and drop them from the public-read whitelist.
-- The form-field registries (channel_form.fields / volunteer_form.fields) are
-- read server-side via the service-role client, so they need NO public policy.

DELETE FROM public.site_settings
WHERE key IN ('volunteer_fillout_embed', 'channel_fillout_embed');

-- Recreate the public-select policy without the Fillout key.
DROP POLICY IF EXISTS site_settings_public_select ON public.site_settings;
CREATE POLICY site_settings_public_select ON public.site_settings
  FOR SELECT TO anon, authenticated
  USING (key IN (
    'copy.sidebar_tagline',
    'copy.footer_tagline',
    'copy.about_mission'
  ));
