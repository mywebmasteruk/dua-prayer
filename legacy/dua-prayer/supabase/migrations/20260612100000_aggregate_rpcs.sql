-- PERF: aggregate in SQL instead of fetching whole tables and counting in JS.
--
-- getTopCategories selected category_id for every published dua;
-- getPlatformStats selected likes for every published dua. Both grow
-- linearly with content. These aggregates only expose counts over published
-- duas, which are already publicly readable.

CREATE OR REPLACE FUNCTION public.dua_category_counts()
RETURNS TABLE (category_id bigint, dua_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.category_id::bigint, count(*)::bigint
  FROM public.duas d
  WHERE d.published = true AND d.category_id IS NOT NULL
  GROUP BY d.category_id;
$$;

CREATE OR REPLACE FUNCTION public.platform_dua_totals()
RETURNS TABLE (total_duas bigint, total_ameens bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::bigint, COALESCE(sum(d.likes), 0)::bigint
  FROM public.duas d
  WHERE d.published = true;
$$;

GRANT EXECUTE ON FUNCTION public.dua_category_counts() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.platform_dua_totals() TO anon, authenticated;
