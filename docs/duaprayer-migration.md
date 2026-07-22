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
| `@kit/community` feed / share / ameen | Done |
| Following tab | Done |
| Channels list + detail + follow | Done |
| Channel apply + admin review (`/channels/apply`, `/admin/channels`) | Done (MVP; no dynamic form builder) |
| Bookmarks + flag/unflag | Done |
| Posting mode (`site_settings`) | Done |
| Site-copy CMS (`/admin/copy`) | Done (composer + empty states) |
| RSS feed (`/feed.xml` + `/admin/settings`) | Done |
| AI moderation (local + optional OpenAI-compatible) | Done (`/admin/settings`) |
| Volunteer apply + admin list (`/volunteer`, `/admin/volunteers`) | Done (MVP; no tiers/RBAC) |
| Donate checkout (`/donate`, `/api/donate/checkout`) | Done |
| Admin dua moderation (`/admin/duas`) | Done |
| Marketing nav (Home / Channels / Bookmarks / Support / Volunteer) | Done |
| About / Safety / Resources + product footer/sitemap | Done |
| Language detect on create + RTL text direction | Done (basic ar/en) |
| Feed language prefs (`accounts.public_data.feed_languages`) | Done (`/home/settings` + server feed filter) |
| Client feed search (loaded batch) | Done |
| Hashtag filter (`?tag=`) + trending chips from loaded feed | Done |
| Community notifications (Makerkit `@kit/notifications`) | Done (ameen milestones, dua/channel/volunteer status) |
| Turnstile (Makerkit CaptchaField) | Done (when `NEXT_PUBLIC_CAPTCHA_SITE_KEY` + `CAPTCHA_SECRET_TOKEN` set) |
| Onboarding gate / topic prefs | Deferred |
| Topic/trending leaderboard rail | Deferred |
| Dua bots + cron | Deferred (large; remains in `legacy/dua-prayer`) |
| Rich RSS filters / `/feed-tags.xml` | Deferred |
| Full site-copy AR groups / footer CMS | Deferred |
| Volunteer tiers / suspend | Deferred |

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

## Deploy note

Before production cutover:

1. Apply all community migrations to the production Supabase project (or migrate data), including `20260722140000_duaprayer_advanced.sql`.
2. Point Vercel root to monorepo `apps/web`.
3. Set Makerkit + Stripe (+ optional captcha / AI moderation) env vars.
4. Verify feed/share/ameen/channels/apply/volunteer/donate/admin/RSS on a preview deploy.
5. Do **not** merge to `main` until that checklist is done.
