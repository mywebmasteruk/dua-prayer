# DuaPrayer

Community prayer wall: share duas, pray for others (Ameen), and moderate content via an admin dashboard.

## Stack

- **Frontend:** Next.js 15, React 19, Tailwind, shadcn/ui
- **Backend:** Supabase (Postgres, Auth, RLS)
- **Deploy:** Vercel or Netlify

## Local setup

```bash
cd apps/dua-prayer
pnpm install
cp .env.example .env.local   # fill in your Supabase keys
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Where | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client + server | Publishable key |
| `SUPABASE_SECRET_KEY` | Server only | Secret key for admin writes |
| `NEXT_PUBLIC_APP_URL` | Server | App URL for auth redirects |
| `SUPER_ADMIN_EMAIL` | Server | Informational only; server-side admin access is hard-coded to `webmaster@duaprayer.com` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Client | Optional Cloudflare Turnstile |
| `TURNSTILE_SECRET_KEY` | Server | Optional Turnstile secret |
| `STRIPE_SECRET_KEY` | Server only | Stripe secret/restricted key for Checkout (`/donate`) |
| `STRIPE_PRICE_DONATION_5` … `_100` | Server only | Preset one-time donation price IDs (see `.env.example`) |
| `STRIPE_DONATION_PRODUCT_ID` | Server only | Optional reference; prices are wired via `STRIPE_PRICE_DONATION_*` |
| `STRIPE_WEBHOOK_SECRET` | Server only | Optional webhook signing secret |

> **Security:** If API keys were shared in chat or committed, rotate them in the [Supabase dashboard](https://supabase.com/dashboard) immediately. Never commit `.env.local`.

## Supabase setup

**Automated (recommended):** add your database connection string to `.env.local`, then:

```bash
npm run setup:db
```

Get `DATABASE_URL` from [Supabase Dashboard](https://supabase.com/dashboard/project/itcoxbkhcwlsjpcwawyl/settings/database) → **Connection string** → URI (use the account that owns this project).

**Manual alternative:** open **SQL Editor** and run `supabase/migrations/20250608000000_initial_schema.sql`, then promote admin:

3. Promote the fixed founding admin account (`webmaster@duaprayer.com`) for profile/RLS consistency:

```sql
UPDATE public.profiles
SET is_admin = true, admin_role = 'admin', admin_permissions = '{}'
WHERE id = (SELECT id FROM auth.users WHERE lower(email) = lower('webmaster@duaprayer.com'));
```

If the user signed up before the migration, ensure a profile row exists:

```sql
INSERT INTO public.profiles (id, is_admin, admin_role, admin_permissions)
SELECT id, true, 'admin', '{}'::jsonb FROM auth.users WHERE lower(email) = lower('webmaster@duaprayer.com')
ON CONFLICT (id) DO UPDATE SET is_admin = true, admin_role = 'admin', admin_permissions = '{}';
```

Server-side `/admin` access is restricted to the exact signed-in email `webmaster@duaprayer.com`, even if other users have admin roles in the database. Running setup promotes that fixed account in the database for RLS consistency.

## Authentication (admin sign-in)

The app uses Supabase Auth for **admin-only** access. Public users can share duas without signing in.

Sign-in options on `/auth`:

- **Google** — `Continue with Google`
- **Password** — email + password (forgot password on a separate page)
- **Magic link** — email-only, one-time sign-in link

### Google OAuth (one-time setup)

1. **Google Cloud Console** — [console.cloud.google.com](https://console.cloud.google.com)
   - Create or select a project → **APIs & Services** → **Credentials**
   - **Create credentials** → **OAuth client ID** → type **Web application**
   - **Authorized JavaScript origins:**
     - `https://dua-prayer.vercel.app`
     - `http://localhost:3000`
   - **Authorized redirect URIs** (Supabase handles the OAuth callback):
     - `https://itcoxbkhcwlsjpcwawyl.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client secret**

2. **Supabase Dashboard** — [Authentication → Providers → Google](https://supabase.com/dashboard/project/itcoxbkhcwlsjpcwawyl/auth/providers)
   - Enable **Google**
   - Paste Client ID and Client secret → Save

3. **Supabase Dashboard** — [Authentication → URL Configuration](https://supabase.com/dashboard/project/itcoxbkhcwlsjpcwawyl/auth/url-configuration)
   - **Site URL:** `https://dua-prayer.vercel.app`
   - **Redirect URLs** (add each line):
     - `https://dua-prayer.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback`

4. Set `NEXT_PUBLIC_APP_URL` in Vercel/local env to match your deployment URL.

### Password reset & magic link

- Forgot password: `/auth/forgot-password` → email → Supabase sends reset link → `/auth/reset-password`
- Magic link and Google both return through `/auth/callback`, then redirect to `/admin` for admins.

**Magic link sign-up (required for new community accounts):**

1. [Authentication → Providers → Email](https://supabase.com/dashboard/project/itcoxbkhcwlsjpcwawyl/auth/providers) — enable **Email** and turn on **Allow new users to sign up**.
2. Confirm **Confirm email** is enabled if you want verified addresses before first sign-in.
3. [Authentication → URL Configuration](https://supabase.com/dashboard/project/itcoxbkhcwlsjpcwawyl/auth/url-configuration) — ensure redirect URLs include your app’s `/auth/callback` (see Google OAuth section above).

If sign-ups stay disabled, magic link only works for emails that already exist in Supabase Auth.

## Deploy to production

**Do not** run `vercel deploy` from the iCloud-synced folder — uploads hang or fail.

| Method | Command | When |
|--------|---------|------|
| **GitHub Actions** (preferred) | `git push origin main` | After one-time secrets in repo Settings → Actions |
| **Local script** | `npm run deploy:prod` | Immediate deploy; clones to `/tmp`, prebuilt upload (~30–90s) |

One-time GitHub secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` — see [DEPLOY.md](./DEPLOY.md).

Production: **https://dua-prayer.vercel.app** only. Other Vercel URLs (e.g. `dua-prayer-deploy.vercel.app`, `*-git-main-*`) are not production.

### Vercel project settings

Repo root **is** the Next.js app (`mywebmasteruk/dua-prayer`). **Root Directory** in Vercel must be `.` — not a parent `apps/` folder. Git auto-deploy is disabled in `vercel.json`; use `git push origin main` (GitHub Actions) or `npm run deploy:prod`. See [DEPLOY.md](./DEPLOY.md).

### Vercel env vars (dashboard)

1. Add all vars from `.env.example`
2. Set `NEXT_PUBLIC_APP_URL` to `https://dua-prayer.vercel.app`
3. For live donations on `/donate`:
   - `STRIPE_SECRET_KEY`, `STRIPE_PRICE_DONATION_5` … `_100` (see `.env.example`)

## E2E tests

Run Playwright tests before marking tasks complete:

```bash
# Local dev server (starts automatically if not running)
npm run test:e2e

# Against production
npm run test:e2e:prod
```

Tests cover: dua submission appears in the feed after submit, homepage category filters, auth page structure (separate forgot-password flow, Google/magic link tabs), and admin redirect when not signed in.

## Features

- Anonymous dua submission with honeypot + rate limiting
- Optional Cloudflare Turnstile when keys are set
- Admin sign-in (Google, password, or magic link)
- Pray (Ameen) with per-user or anonymous cookie deduplication
- Category filter + paginated feed
- Flag for moderation (server-side)
- Social sharing (WhatsApp, Telegram, X, Facebook)
- Admin dashboard with RBAC (founding admin + moderator/admin roles)
- Roles & Access management at `/admin/settings/roles` (founding admin only)
- Dark mode

## Brand assets

- `public/logo-icon.png` — from `DuaPrayer-Hand-Logo-green.png` (header, favicon, pray button)
- `public/logo-wide.png` — from `dua-prayer-logo-wide.png` (auth pages, mobile hero, OG image)
