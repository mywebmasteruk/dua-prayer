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
| `apps/web/supabase` | Makerkit schema & migrations |
| `packages/features` | Auth, accounts, billing, admin features |
| `legacy/dua-prayer` | Previous DuaPrayer app (source for porting) |

## Production

Canonical URL: **https://dua-prayer.vercel.app**

Do **not** merge this Makerkit foundation to `main` until product features are ported and Vercel is pointed at `apps/web`. See `DEPLOY.md` and the migration doc.
