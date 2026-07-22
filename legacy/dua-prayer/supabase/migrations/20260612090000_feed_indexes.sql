-- PERF: indexes for per-request feed enrichment lookups.
--
-- Existing unique indexes on dua_prayers lead with dua_id, so queries
-- filtering by user_id or voter_hash alone fall back to sequential scans.
-- dua_bot_event_posts had no index on dua_id at all, and enrichDuas queries
-- it by dua_id on every feed render.

CREATE INDEX IF NOT EXISTS dua_prayers_user_id_idx
  ON public.dua_prayers (user_id) WHERE (user_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS dua_prayers_voter_hash_idx
  ON public.dua_prayers (voter_hash) WHERE (voter_hash IS NOT NULL);

CREATE INDEX IF NOT EXISTS dua_bot_event_posts_dua_id_idx
  ON public.dua_bot_event_posts (dua_id);
