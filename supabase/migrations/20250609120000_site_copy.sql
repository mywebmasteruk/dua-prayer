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
