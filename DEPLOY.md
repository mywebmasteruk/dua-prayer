# Deploy to production

Canonical production URL: **https://dua-prayer.vercel.app** → **https://www.duaprayer.com/**


## Architecture (important)

| Surface | Code | Role |
|---------|------|------|
| **Public frontend (live www today)** | `legacy/dua-prayer/` | Original consumer UI — **what production Root Directory points at now** |
| **Target foundation + UI** | `apps/web/` + `packages/*` (Makerkit) | Auth, accounts, billing, admin **and** rebuilt DuaPrayer consumer UI (3-column shell) |

**Product direction:** use Makerkit as the foundation, and rebuild the public frontend to match the old DuaPrayer design (not Makerkit’s stock marketing shell).

Until that rebuild is ready for cutover, www stays on `legacy/dua-prayer`. Do **not** point production at `apps/web` while the Makerkit marketing homepage still looks like the stock kit.


## Production deploy (public frontend — interim)

Push to `main` runs **Deploy Vercel Production**:

1. Sets Vercel **Root Directory** = `legacy/dua-prayer`
2. Install/build: `npm install --legacy-peer-deps` / `npm run build`
3. Deploys with `VERCEL_TOKEN` (CLI prebuilt) or `VERCEL_DEPLOY_HOOK_URL`

Monitor: **https://github.com/mywebmasteruk/dua-prayer/actions**


### Vercel settings (dua-prayer project — interim)

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

### Smoke after deploy (interim)

- `/` → original 3-column feed shell
- `/auth` → **200** (legacy auth)
- `/auth/sign-in` → **404** (Makerkit-only route; not live on www yet)
- `/channels`, `/donate`, `/admin`, `/feed.xml`


## Target cutover (Makerkit + rebuilt UI)

When the rebuilt consumer UI on Makerkit matches the old design closely enough:

1. Finish Makerkit DB cutover (see `docs/duaprayer-migration.md` / cutover workflow)
2. Point Vercel Root Directory at `apps/web` (pnpm monorepo install/build)
3. Smoke: `/` 3-column shell, `/auth/sign-in`, `/home`, `/channels`, `/admin`

Until then, treat `apps/web` as the foundation + UI rebuild workspace, not production www.


## Git safety

- Never commit `.env` secrets, credentials, or `.vercel/`
- Never force push
- Never update git config from automation
