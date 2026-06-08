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
| `PLATFORM_FOUNDER_EMAIL` | Server | Founding super-admin email (full access, env-based) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Client | Optional Cloudflare Turnstile |
| `TURNSTILE_SECRET_KEY` | Server | Optional Turnstile secret |

> **Security:** If API keys were shared in chat or committed, rotate them in the [Supabase dashboard](https://supabase.com/dashboard) immediately. Never commit `.env.local`.

## Supabase setup

**Automated (recommended):** add your database connection string to `.env.local`, then:

```bash
npm run setup:db
```

Get `DATABASE_URL` from [Supabase Dashboard](https://supabase.com/dashboard/project/itcoxbkhcwlsjpcwawyl/settings/database) → **Connection string** → URI (use the account that owns this project).

**Manual alternative:** open **SQL Editor** and run `supabase/migrations/20250608000000_initial_schema.sql`, then promote admin:

3. Promote your founding admin (must match `PLATFORM_FOUNDER_EMAIL` in `.env.local`):

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

The founding admin also receives **full super-admin access** when their signed-in email matches `PLATFORM_FOUNDER_EMAIL`, even before the SQL step — but running setup promotes them in the database for RLS consistency.

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

## Deploy (Vercel)

1. Import the repo, set root directory to `apps/dua-prayer`
2. Add all env vars from `.env.example`
3. Set `NEXT_PUBLIC_APP_URL` to your production URL
4. Deploy

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
