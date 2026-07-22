# Deploy to production

Canonical production URL: **https://dua-prayer.vercel.app** → **https://www.duaprayer.com/**

DuaPrayer is a **Makerkit Pro pnpm monorepo**. The web app lives in `apps/web`.


## Makerkit cutover checklist (required)

Production stays on the legacy app until all of these succeed:

1. **Supabase migrations** (production project `itcoxbkhcwlsjpcwawyl`):
   ```bash
   SUPABASE_PROJECT_REF=itcoxbkhcwlsjpcwawyl ./scripts/cutover-db.sh
   ```
   Applies Makerkit schemas + `apps/web/supabase/migrations/20260722*.sql`.

2. **Vercel project settings** (dua-prayer → Settings → General):

   | Setting | Required value |
   |---------|----------------|
   | **Root Directory** | `apps/web` (Makerkit default) **or** `.` with root `vercel.json` |
   | **Framework Preset** | Next.js |
   | **Install / Build overrides** | **Off** — use `vercel.json` (`corepack enable && pnpm install`, `pnpm --filter web build`) |
   | **Node.js** | 20.x+ |

3. **Vercel environment variables** (Production):

   | Variable | Notes |
   |----------|--------|
   | `NEXT_PUBLIC_SITE_URL` | `https://www.duaprayer.com` |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://itcoxbkhcwlsjpcwawyl.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_PUBLIC_KEY` | Preferred; falls back to `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
   | `SUPABASE_SECRET_KEY` | Preferred; falls back to `SUPABASE_SERVICE_ROLE_KEY` |
   | `SUPABASE_DB_WEBHOOK_SECRET` | Required for Makerkit DB webhooks |
   | Stripe / mailer / captcha / AI / cron | As used by product features |

4. **Redeploy** — push to `main` (Actions) or Redeploy in the Vercel dashboard.

5. **Smoke test** — `/auth/sign-in` must be **200** (not 404). Also check feed, channels/apply, volunteer, donate, admin, `/feed.xml`.


## Recommended: push to main (GitHub Actions)

Push to `main` triggers **Deploy Vercel Production** (`.github/workflows/deploy-vercel.yml`).

**Preferred secrets** (CLI prebuilt deploy — pulls Production env from Vercel):

| Secret | Value |
|--------|--------|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) |

Org/project IDs are set in the workflow (`team_km2T92NwivBy9c85XLjhTScR` / `prj_8sQGGuKxXAfJdnHeRXuX0jh15dIk`).

**Fallback** if `VERCEL_TOKEN` is missing: `VERCEL_DEPLOY_HOOK_URL` (Vercel → Deploy Hooks). The workflow waits for a GitHub Production deployment matching the commit SHA.

Monitor: **https://github.com/mywebmasteruk/dua-prayer/actions**


## If the deploy fails

1. Open the failed deployment logs in Vercel (or `npx vercel inspect <dpl_…> --logs`).
2. Confirm Root Directory + Install/Build overrides match the table above.
3. Confirm Makerkit env vars (especially Supabase public/secret key names).
4. Confirm DB migrations were applied before expecting product routes to work.


## Git safety

- **Never** commit `.env` secrets, credentials, or `.vercel/`.
- **Never** force push.
- **Never** update git config from automation.
- Do **not** run `vercel deploy` from an iCloud-synced project folder.


## Local UI iteration

While iterating locally with HMR, do not kill port 3000 or run `next build` against the live dev cache. See `.cursor/rules/local-ui-iteration.mdc`.
