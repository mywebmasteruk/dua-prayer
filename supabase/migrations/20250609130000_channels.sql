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
