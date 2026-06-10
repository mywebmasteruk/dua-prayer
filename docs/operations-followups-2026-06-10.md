# Operations follow-ups — 2026-06-10

## Durable hashtags phase 2 plan

Do not run this against production until the schema and backfill SQL are reviewed.

1. Add a `dua_hashtags` table keyed by normalized tag and `dua_id`, with timestamps and a unique constraint on `(dua_id, tag)`.
2. Backfill from existing `duas.text` by applying the same normalization rules as `lib/hashtags.ts`: NFKC, trim edge punctuation/symbols, convert `_` to `-`, lowercase, max 40 chars, max 6 tags per dua.
3. Add indexes for tag lookup and trending queries, for example `(tag)` and `(tag, created_at)`; include `duas.likes` only through joins or a maintained aggregate if query volume requires it.
4. Update write paths so `createDua` and admin edit actions refresh hashtag rows in the same logical operation as the dua text change.
5. Update feed/search/trending reads to use `dua_hashtags` instead of parsing text at request time.
6. Verify on staging with a small backfill first: duplicate tags on one dua collapse, underscores normalize to hyphens, long tags truncate, existing public hashtag filters return the same duas.
7. Only after staging verification, apply the migration and backfill to production during a low-traffic window.

## GitHub Actions `VERCEL_TOKEN` fix

The production deploy workflow uses `${{ secrets.VERCEL_TOKEN }}` in `.github/workflows/deploy-vercel.yml`. If GitHub Actions reports an invalid token:

1. In Vercel, create a new token at https://vercel.com/account/tokens using the account/team that owns the DuaPrayer project.
2. In GitHub, open the repository settings: **Settings → Secrets and variables → Actions → Repository secrets**.
3. Replace `VERCEL_TOKEN` with the new token value. Do not paste it into workflow files or commit it.
4. Confirm `VERCEL_ORG_ID` is `team_km2T92NwivBy9c85XLjhTScR` and `VERCEL_PROJECT_ID` is `prj_8sQGGuKxXAfJdnHeRXuX0jh15dIk`.
5. Re-run the failed workflow or push a new commit to `main`.
6. If the workflow is still blocked, deploy locally with the existing fallback: `npm run deploy:prod` from the repo root after `npx vercel login` succeeds.
