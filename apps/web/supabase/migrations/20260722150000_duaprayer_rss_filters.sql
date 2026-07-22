-- RSS feed include/exclude filter settings

INSERT INTO public.site_settings (key, value)
VALUES
  ('rss.include_channel_posts', 'true'),
  ('rss.include_freeform_duas', 'true'),
  ('rss.only_verified_channels', 'false'),
  ('rss.excluded_channel_ids', '[]')
ON CONFLICT (key) DO NOTHING;
