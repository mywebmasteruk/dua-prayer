-- Store each dua's language so the feed can filter by language reliably
-- (text-script detection can't tell Spanish/French from English, or Urdu from
-- Arabic). Bots set it from their configured language; legacy rows are
-- backfilled by script (Arabic-script → 'ar', otherwise 'en').
alter table public.duas add column if not exists language text;

update public.duas
set language = case when text ~ '[؀-ۿ]' then 'ar' else 'en' end
where language is null;
