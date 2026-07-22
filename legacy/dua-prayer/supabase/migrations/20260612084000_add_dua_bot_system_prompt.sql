ALTER TABLE public.dua_bots
  ADD COLUMN IF NOT EXISTS system_prompt text;
