-- Record the AI provider snapshot used by each dua bot run for auditability.

ALTER TABLE public.dua_bot_runs
  ADD COLUMN IF NOT EXISTS ai_provider text,
  ADD COLUMN IF NOT EXISTS ai_model text;
