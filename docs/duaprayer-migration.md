# DuaPrayer → Makerkit Pro migration

## Goal

Replace the custom SaaS foundation with **Makerkit Pro**, while keeping DuaPrayer product behavior.

## What moved where

| Previous (root) | Now |
|-----------------|-----|
| Entire Next.js app | `legacy/dua-prayer/` (preserved, not deleted) |
| New SaaS foundation | Makerkit Pro monorepo at repo root (`apps/web`, `packages/*`) |

## Porting status

| Feature | Status |
|---------|--------|
| Schema: categories, duas, dua_prayers, pray_for_dua | Done |
| Schema: bookmarks, dua_flags, user_follows, site_settings | Done |
| Schema: channel applications, volunteers, RSS/AI settings | Done (`20260722140000_duaprayer_advanced.sql`) |
| Schema: community_volunteers, dua_bots (+ runs/events) | Done (`20260722160000_duaprayer_volunteers_and_bots.sql`) |
| `@kit/community` feed / share / ameen | Done |
| Following tab | Done |
| Channels list + detail + follow | Done |
| Channel apply + admin review (`/channels/apply`, `/admin/channels`) | Done |
| Bookmarks + flag/unflag | Done |
| Posting mode (`site_settings`) | Done |
| Site-copy CMS (`/admin/copy`) | Done |
| Footer links CMS + footer tagline | Done |
| RSS feed (`/feed.xml` + `/admin/settings`) | Done |
| Rich RSS (`/feed-tags.xml`, topic/hashtag/lang categories) | Done |
| RSS source filters (channels/freeform/verified/exclude) | Done |
| RSS title/author/copyright/TTL/description/language CMS | Done |
| Arabic composer site-copy + auto RTL/AR labels | Done |
| AI moderation (local + optional OpenAI-compatible) | Done (`/admin/settings`) |
| Volunteer apply + admin list (`/volunteer`, `/admin/volunteers`) | Done |
| Volunteer tiers / suspend (`community_volunteers` roster) | Done |
| Dynamic application forms MVP (`/admin/forms`) | Done (incl. file uploads) |
| Donate checkout (`/donate`, `/api/donate/checkout`) | Done |
| Admin dua moderation (`/admin/duas`) | Done |
| Marketing nav (Home / Channels / Bookmarks / Support / Volunteer) | Done |
| About / Safety / Resources + product footer/sitemap | Done |
| Language detect on create + RTL text direction | Done (basic ar/en) |
| Feed language prefs (`accounts.public_data.feed_languages`) | Done (`/home/settings` + server feed filter) |
| Feed topic prefs (`accounts.public_data.feed_topics`) | Done (`/home/settings` + server feed filter) |
| Client feed search (loaded batch) | Done |
| Hashtag filter (`?tag=`) + trending chips from loaded feed | Done |
| Topic/trending leaderboard rail | Done |
| Onboarding gate (guided first-run) | Done |
| Community notifications (Makerkit `@kit/notifications`) | Done (ameen milestones, dua/channel/volunteer status) |
| Turnstile (Makerkit CaptchaField) | Done (when `NEXT_PUBLIC_CAPTCHA_SITE_KEY` + `CAPTCHA_SECRET_TOKEN` set) |
| Dua bots + cron | Done (RSS → AI → dua runner MVP; skips Tavily / library fallback / auto-categorize) |
| Application file uploads | Done (`application-uploads` bucket + signed upload/download) |
| Auth tagline + AR composer category labels | Done |
| Volunteer tier roster / suspend (ops metadata) | Done |
| Volunteer RBAC into Makerkit `/admin` routes | Skipped (Makerkit remains `is_super_admin` only; tiers are bookkeeping) |

## Foundation provided by Makerkit

- Auth → `@kit/auth`
- Accounts / teams → `@kit/accounts`, `@kit/team-accounts`
- Billing subscriptions → `@kit/billing` (donations use a dedicated checkout path)
- Super admin → `@kit/admin` + `/admin/duas`

## Local setup

```bash
pnpm install
pnpm supabase:web:start
# copy keys into apps/web/.env.development
pnpm supabase:web:reset
pnpm dev
```

Optional donate: set `STRIPE_SECRET_KEY` (+ site URL).

Optional bots cron: set `CRON_SECRET` or `BOT_RUNNER_SECRET`, call `/api/cron/dua-bots` with `Authorization: Bearer <secret>`.

## Deploy / cutover note

Code is on `main` (Makerkit monorepo). Production cutover still requires ops steps — see root `DEPLOY.md`.

1. Apply Makerkit + community migrations to production Supabase (`itcoxbkhcwlsjpcwawyl`) via `./scripts/cutover-db.sh`.
2. Set Vercel Root Directory to `apps/web` (or repo root with root `vercel.json`); turn **off** Install/Build overrides so pnpm commands apply.
3. Set Makerkit env vars (public key accepts legacy `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / anon; secret accepts `SUPABASE_SERVICE_ROLE_KEY`).
4. Redeploy and verify `/auth/sign-in` returns **200** (404 means the legacy build is still live or the Makerkit build failed).
5. Smoke-test feed/share/ameen/channels/apply/volunteer/donate/admin/RSS/forms/bots.
