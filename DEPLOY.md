# Deploy to production

Canonical production URL: **https://dua-prayer.vercel.app** → **https://www.duaprayer.com/**


## Architecture (important)

| Surface | Code | Role |
|---------|------|------|
| **Public frontend** | `legacy/dua-prayer/` | Original DuaPrayer consumer UI (feed, channels, auth modal, admin) — **what www serves** |
| **Makerkit** | `apps/web/` + `packages/*` | Backoffice / SaaS foundation work — **not** the public site |

Do **not** point the production Vercel project Root Directory at `apps/web`. That ships Makerkit’s marketing shell as the homepage.


## Production deploy (public frontend)

Push to `main` runs **Deploy Vercel Production**:

1. Sets Vercel **Root Directory** = `legacy/dua-prayer`
2. Install/build: `npm install --legacy-peer-deps` / `npm run build`
3. Deploys with `VERCEL_TOKEN` (CLI prebuilt) or `VERCEL_DEPLOY_HOOK_URL`

Monitor: **https://github.com/mywebmasteruk/dua-prayer/actions**


### Vercel settings (dua-prayer project)

| Setting | Value |
|---------|--------|
| Root Directory | `legacy/dua-prayer` |
| Install Command | `npm install --legacy-peer-deps` |
| Build Command | `npm run build` |
| Framework | Next.js |

### Env (legacy names)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or anon)
- `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL=https://www.duaprayer.com`
- Stripe / Turnstile / cron as before

### Smoke after deploy

- `/` → original 3-column feed shell
- `/auth` → **200** (legacy auth)
- `/auth/sign-in` → **404** (Makerkit-only route; should not be live on www)
- `/channels`, `/donate`, `/admin`, `/feed.xml`


## Makerkit (backoffice) — separate

Makerkit stays in the monorepo for future backoffice work. It must **not** replace the public frontend until product explicitly opts in, with its own deploy target and DB cutover.


## Git safety

- Never commit `.env` secrets, credentials, or `.vercel/`
- Never force push
- Never update git config from automation
