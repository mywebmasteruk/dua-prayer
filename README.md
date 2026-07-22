# DuaPrayer

Community space to share duas, make ameen, and support one another.

## Foundation

This repository now uses **[Makerkit Pro](https://makerkit.dev)** (Next.js + Supabase Turbo kit v3) as the SaaS foundation:

- Authentication (Supabase Auth)
- Personal & team accounts
- Billing (Stripe)
- Super admin
- Notifications, i18n, email templates

DuaPrayer product features from the previous app live under `legacy/dua-prayer/` while they are ported onto Makerkit. See [`docs/duaprayer-migration.md`](docs/duaprayer-migration.md).

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Supabase (Postgres, Auth, Storage, RLS)
- Tailwind CSS 4 + Shadcn UI (`@kit/ui`)
- Turborepo + pnpm workspaces

## Local setup

```bash
# prerequisites: Node 20.10+, pnpm 11.15+, Docker
pnpm install
pnpm supabase:web:start
pnpm supabase:web:reset
pnpm dev
```

App: [http://localhost:3000](http://localhost:3000)

## Important paths

| Path | Purpose |
|------|---------|
| `apps/web` | Main Next.js app |
| `apps/web/supabase` | Makerkit + community migrations |
| `packages/features/community` | Feed, channels, bookmarks, ameen, hashtags, apply/volunteer, RSS, AI moderation, feed language prefs |
| `packages/features` | Auth, accounts, billing, admin features |
| `legacy/dua-prayer` | Previous app (deferred: dua bots, rich RSS filters, full CMS) |

## Product routes

| Route | Feature |
|-------|---------|
| `/` | Community feed + share dua |
| `/channels` | Channel list + follow |
| `/channels/apply` | Request a community channel |
| `/channels/[handle]` | Channel feed |
| `/bookmarks` | Saved duas |
| `/volunteer` | Volunteer application |
| `/donate` | Support / Stripe checkout |
| `/about` `/safety` `/resources` | Trust / help pages |
| `/feed.xml` | Public RSS (when enabled in admin settings) |
| `/feed-tags.xml` | RSS with hashtags as categories (automation-friendly) |
| `/admin/duas` | Super-admin dua moderation |
| `/admin/channels` | Channel applications |
| `/admin/volunteers` | Volunteer applications |
| `/admin/copy` | Site copy |
| `/admin/settings` | RSS + AI moderation |

## Production

Canonical URL: **https://dua-prayer.vercel.app**

Do **not** merge this Makerkit foundation to `main` until product features are ported and Vercel is pointed at `apps/web`. See `DEPLOY.md` and the migration doc.
