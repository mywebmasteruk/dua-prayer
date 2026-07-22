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
| `@kit/community` feed / share / ameen | Done |
| Following tab | Done |
| Channels list + detail + follow | Done |
| Bookmarks + flag/unflag | Done |
| Posting mode (`site_settings`) | Done |
| Donate checkout (`/donate`, `/api/donate/checkout`) | Done |
| Admin dua moderation (`/admin/duas`) | Done |
| Marketing nav (Home / Channels / Bookmarks / Support) | Done |
| Turnstile (Makerkit CaptchaField) | Done (when `NEXT_PUBLIC_CAPTCHA_SITE_KEY` + `CAPTCHA_SECRET_TOKEN` set) |
| AI moderation | Pending (optional) |
| Channel applications / bots / site-copy CMS / RSS | Pending (advanced leftovers in `legacy/`) |
| Volunteer flows | Pending (legacy) |

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

1. Apply both community migrations to the production Supabase project (or migrate data).
2. Point Vercel to monorepo `apps/web`.
3. Set Makerkit + Stripe env vars.
4. Verify feed/share/ameen/channels/donate/admin on a preview deploy.
