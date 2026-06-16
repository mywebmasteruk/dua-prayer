-- Curated duas (authentic Arabic + transliteration + translation + source +
-- a contextual line) are far longer than freeform one-liners. Widen the cap.
alter table public.duas drop constraint if exists duas_text_check;
alter table public.duas
  add constraint duas_text_check check (char_length(text) >= 15 and char_length(text) <= 1200);
