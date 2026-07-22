# DuaPrayer → Makerkit Pro migration

## Goal

Replace the custom SaaS foundation (auth, accounts, admin shell, billing wiring) with **Makerkit Pro**, while keeping DuaPrayer product behavior.

## What moved where

| Previous (root) | Now |
|-----------------|-----|
| Entire Next.js app | `legacy/dua-prayer/` (preserved, not deleted) |
| New SaaS foundation | Makerkit Pro monorepo at repo root (`apps/web`, `packages/*`) |

## Foundation provided by Makerkit (use these)

- Auth flows → `@kit/auth` / `/auth/*`
- Personal & team accounts → `@kit/accounts`, `@kit/team-accounts`
- Billing / Stripe → `@kit/billing`, `@kit/stripe`
- Super admin → `@kit/admin`
- Notifications → `@kit/notifications`
- Supabase clients → `@kit/supabase/*`
- Server actions → `@kit/next/safe-action`

## Product features still to port from `legacy/dua-prayer`

Priority order for follow-up work:

1. **Public dua feed** — home stream, ameen, search, filters
2. **Share dua composer** — form fields, rate limits, Turnstile
3. **Channels** — list, detail, follow, applications
4. **Profiles / bookmarks / notifications** (product-specific)
5. **Admin moderation** — bots, site copy, volunteers, RSS (map onto Makerkit admin where possible)
6. **Donate** — map onto Makerkit billing or keep one-time Checkout
7. **Supabase schema** — merge DuaPrayer tables/RLS with Makerkit `accounts` model (`account_id` where needed)

## Database note

Makerkit ships its own schema under `apps/web/supabase`. DuaPrayer’s schema is under `legacy/dua-prayer/supabase/migrations`. Do **not** point production at Makerkit’s empty schema until domain migrations are rewritten to coexist with Makerkit’s `accounts` / RLS model.

## Deploy note

Until Vercel `rootDirectory` is `apps/web` and the feed is ported, keep production on the previous stack (do not merge this branch to `main` for a live cutover).
