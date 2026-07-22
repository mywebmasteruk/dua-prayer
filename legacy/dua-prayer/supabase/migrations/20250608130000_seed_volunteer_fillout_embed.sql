-- Default volunteer Fillout embed for local/testing (public form URL)
INSERT INTO public.site_settings (key, value)
VALUES ('volunteer_fillout_embed', 'https://forms.fillout.com/t/wHXBM6Gk1bus')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();
