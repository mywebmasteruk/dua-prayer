# DuaPrayer — AI agent handoff

Primary context doc for agents switching into this repo. Holds architecture, completed work, active systems, pitfalls, and runbooks. **No secret values here** — env var names only.

| Also read | Purpose |
|-----------|---------|
| [README.md](./README.md) | Human setup, auth, features |
| [DEPLOY.md](./DEPLOY.md) | Vercel/GitHub Actions deploy details |
| [docs/volunteer-webhook.md](./docs/volunteer-webhook.md) | Fillout webhook setup & curl tests |
| [docs/supabase-email-templates/README.md](./docs/supabase-email-templates/README.md) | Branded auth email templates |
| `.cursor/rules/local-ui-iteration.mdc` | **Strict** dev-server rules during UI work |
| `.cursor/rules/deploy-on-complete.mdc` | Commit + deploy when tasks finish |
| `.cursor/rules/editorial-line.mdc` | Product copy tone (neutral community platform) |

---

## Quick start

```bash
cd apps/dua-prayer   # or full iCloud path to dua-prayer root
cp .env.example .env.local   # fill Supabase keys; never commit
npm install --legacy-peer-deps
npm run dev          # idempotent — scripts/dev-persistent.sh
```

| Item | Value |
|------|--------|
| Local app | `http://localhost:3000/` |
| Production | **https://dua-prayer.vercel.app** (canonical only) |
| Supabase project ref | `itcoxbkhcwlsjpcwawyl` |
| GitHub repo | `mywebmasteruk/dua-prayer` |
| Stack | Next.js 15, React 19, Tailwind, shadcn/ui, Supabase |

**Health check (non-destructive):**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
kill -0 $(cat .dev-server.pid) 2>/dev/null && echo "supervisor up"
```

**Typecheck without breaking dev:** `npx tsc --noEmit` — not `npm run build`.

---

## Architecture

### App shape

```
app/                    # Next.js App Router pages + server actions
  page.tsx              # Home feed (3-column layout)
  actions/              # Server actions (duas, auth, etc.)
  api/
    webhooks/volunteer/ # Inbound volunteer registration
    checkout/           # Stripe donations
  admin/                # RBAC dashboard (auth required)
components/             # UI (feed, composer, admin, auth)
lib/                    # Supabase clients, auth, parsers, types
supabase/migrations/    # Postgres schema (run via setup:db or SQL editor)
scripts/                # dev-persistent, deploy-prod, email templates
```

### Data & auth

- **Public:** anonymous dua submission, ameen (pray), flag, share — no sign-in required.
- **Admin:** Supabase Auth (Google, password, magic link) + RBAC on `profiles` (`admin_permissions`, `admin_role`, `is_admin`).
- **Volunteers:** webhook creates `auth.users` + `profiles` with `account_status = pending_review`; admin activates at `/admin/volunteers`.
- **Server writes:** `createAdminSupabaseClient()` (service role) for moderation, webhooks, rate-limited public actions.

### Layout system (X / Bluesky-inspired)

- **Max width:** `1250px` via `.site-container` in `app/globals.css` (`max-w-[1250px]`).
- **Home grid:** `280px` sidebar | fluid feed | `320px` right rail (`app/page.tsx`, `HomeStreamTabs`).
- **Feed rows:** flat bordered rows, icon-only footer actions (ameen, like, share menu, flag) — see `components/dua-list.tsx`.
- **Composer:** `HomeComposer` opens a **full-page overlay** via `createPortal` (`z-[100]`), not Radix Dialog — body scroll locked.
- **RTL / Arabic:** `lib/detect-language.ts` — auto `dir`, `font-arabic-dua`, composer language switcher (`auto` | `en` | `ar`) in `components/dua-form.tsx`.
- **Attribution:** Masjidweb.com in `components/footer.tsx` and `app/about/page.tsx`; donate CTA on about page.

### Editorial constraint

DuaPrayer is a **neutral community platform** for sharing duas — not a religious advisor. See `.cursor/rules/editorial-line.mdc` before writing copy.

---

## Completed features (recent session)

### Product / UI

| Feature | Where | Notes |
|---------|-------|-------|
| X/Bluesky-style feed | `components/dua-list.tsx`, `app/page.tsx`, `globals.css` | 1250px, flat rows, icon footer |
| Composer modal | `components/home-composer.tsx` | Portal overlay; SelectContent z-index above modal |
| Duplicate "Anonymous" removed | `components/dua-list.tsx` | Single source label: "Anonymous" or "Community member" |
| "Open" badge removed | Feed UI | No open/closed badge on rows |
| Flag toggle (UI) | `components/dua-list.tsx` | Stays visible; **red when flagged**; second click clears **client state only** (see pitfalls) |
| Language switcher | `components/dua-form.tsx` | Auto-detect + manual en/ar |
| Volunteer modal auto-close | `components/volunteer/volunteer-apply-section.tsx` | Listens for Fillout `form_submit` postMessage from `embed.fillout.com` |
| Masjidweb attribution | `footer.tsx`, `about/page.tsx` | |
| Donate CTA on About | `app/about/page.tsx` | Links to `/donate` |

### Volunteer / webhook system

| Piece | Path |
|-------|------|
| API route | `app/api/webhooks/volunteer/route.ts` |
| Body parser | `lib/volunteer-webhook-parse.ts` — Fillout `submission.questions[]` + flat JSON keys |
| Registration logic | `lib/volunteers.ts` |
| Admin UI | `app/admin/volunteers/page.tsx`, `components/admin/admin-volunteers-list.tsx` |
| Integration docs tab | `components/admin/integration-volunteer-webhook-tab.tsx` |
| Migration | `supabase/migrations/20250609140000_volunteer_registration.sql` |

**Flow:** POST with `X-Webhook-Secret` → parse email/name/skills → create/update auth user with `pending_review` → admin **Activate** (volunteer/moderator/admin) or **Reject** / **Delete**.

### Email templates

- HTML in `supabase/templates/*.html`
- Apply: Supabase Dashboard **or** `scripts/apply-supabase-email-templates.sh` (needs `SUPABASE_ACCESS_TOKEN`)
- Logo URL in templates: `https://dua-prayer.vercel.app/logo-wide.png`
- Details: [docs/supabase-email-templates/README.md](./docs/supabase-email-templates/README.md)

### Other migrations (context)

| Migration | Purpose |
|-----------|---------|
| `20250608000000_initial_schema.sql` | Core duas, profiles, RLS |
| `20250608100000_site_settings.sql` | Site settings |
| `20250608120000_admin_rbac.sql` | Admin permissions |
| `20250608130000_seed_volunteer_fillout_embed.sql` | Default Fillout embed URL |
| `20250609120000_site_copy.sql` | Editable site copy |
| `20250609130000_channels.sql` | Channels feature |
| `20250609140000_volunteer_registration.sql` | Volunteer pending review |

Apply locally: set `DATABASE_URL` in `.env.local`, run `npm run setup:db`.

---

## Active systems

### Managed dev server

| File | Role |
|------|------|
| `.dev-server.pid` | Supervisor bash PID (`dua-prayer-dev-supervisor`) — **not** the Next listener |
| `scripts/dev-persistent.sh` | Detached supervisor, port watchdog, auto-restart |
| `/tmp/dua-prayer-dev.log` | Dev logs |
| `/tmp/dua-prayer-next` | `NEXT_DIST_DIR` — dev build output (iCloud-safe) |

Start: `npm run dev` or `npm run dev:persistent` (same script).

### Deploy paths

1. **Preferred:** `git push origin main` → GitHub Actions (`.github/workflows/deploy-vercel.yml`)
2. **Fallback:** `npm run deploy:prod` → `scripts/deploy-prod.sh` (clone to `/tmp/dua-prayer-deploy`, prebuilt Vercel)

See [DEPLOY.md](./DEPLOY.md) for secrets, Vercel project IDs, and author-block workarounds.

### Environment variables (names only)

| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client + server | Publishable key |
| `SUPABASE_SECRET_KEY` | Server | Service role / admin writes |
| `NEXT_PUBLIC_APP_URL` | Server | Auth redirects, webhook base URL |
| `DATABASE_URL` | Local scripts | Migrations via `npm run setup:db` |
| `VOLUNTEER_WEBHOOK_SECRET` | Server (Vercel prod) | `X-Webhook-Secret` on inbound webhook |
| `VOLUNTEER_NOTIFY_WEBHOOK_URL` | Server (optional) | Outbound Slack/Zapier on new application |
| `SUPER_ADMIN_EMAIL` | Server | Founding super-admin (see `.env.example`) |
| `STRIPE_*` | Server | Donations (`/donate`) |
| `NEXT_PUBLIC_TURNSTILE_*`, `TURNSTILE_SECRET_KEY` | Optional | Bot protection |

Full list: `.env.example`. **Never commit** `.env.local`, `.env.vercel.production`, or secret values.

---

## DO NOT (agent mistakes)

These caused real outages and lost iteration time. **Do not repeat.**

### Local dev / HMR

| Forbidden | Why |
|-----------|-----|
| `kill` / `pkill` / `lsof -ti:3000 \| xargs kill` on port **3000** | Kills user's browser session → `ERR_CONNECTION_REFUSED` |
| `kill … && npm run dev` or `rm -rf .next && npm run dev` | Same; corrupts dev cache on iCloud paths |
| `npm run build` / `next build` **while dev is running** | Rewrites dist → CSS/chunk **500** errors |
| `rm -rf .next` or `/tmp/dua-prayer-next` without user approval | Breaks running dev |
| Foreground `next dev` in agent terminal | Competes with managed supervisor |
| Second dev server on 3001/3002 for "testing" | Breaks HMR on 3000 |

**Allowed:** edit files in place; `curl` health check; `npx tsc --noEmit`; kill **only** stray listeners on 3001/3002.

### Deploy

| Forbidden | Why |
|-----------|-----|
| `vercel deploy` from iCloud/CloudDocs project path | ~171MB upload, stuck **UNKNOWN** deploys |
| Assuming `npm run deploy:prod` includes **uncommitted** local work | Script resets to **`origin/main`** — push or commit first |
| Using non-canonical URLs as production | Only **https://dua-prayer.vercel.app** |
| Committing `.vercel/` or `.env*` secrets | Security / noise |

### Product / code assumptions

| Pitfall | Reality |
|---------|---------|
| Feed flag "unflag" persists to DB | **UI only** clears `reportedDuas` state; DB unflag is admin-only via `unflagDua` in `/admin` |
| Fillout webhook without header | Must be **`X-Webhook-Secret`** (not `Authorization`, not query param) |
| Fillout GET to webhook URL | GET returns info only; submissions need **POST** |
| Supabase MCP updates email templates | **Not supported** — use Dashboard or `apply-supabase-email-templates.sh` |
| Framing DuaPrayer as religious authority | Violates editorial line — see `editorial-line.mdc` |

---

## Deploy runbook

### Standard (after code is on `main`)

```bash
git status                    # ensure changes committed & pushed
git push origin main          # triggers GitHub Actions
# Monitor: https://github.com/mywebmasteruk/dua-prayer/actions
# Verify: https://dua-prayer.vercel.app
```

### Immediate CLI deploy (uncommitted work **not** included unless pushed)

```bash
git add … && git commit -m "…" && git push origin main   # if local changes should ship
npm run deploy:prod   # only after push if you need those commits
```

`deploy-prod.sh` clones `origin/main` to `/tmp/dua-prayer-deploy`, strips `.git`, copies `.vercel` link, runs prebuilt deploy (~60–120s).

### When task completes (user preference)

Follow `.cursor/rules/deploy-on-complete.mdc`: commit relevant changes, deploy, report short hash + production URL.

---

## Webhook runbook (volunteer)

**Endpoint:** `POST https://dua-prayer.vercel.app/api/webhooks/volunteer`

**Auth:** header `X-Webhook-Secret: <VOLUNTEER_WEBHOOK_SECRET>` (Vercel Production env).

**Body options:**

1. **Fillout default payload** — `submission.questions[]` auto-mapped (Email, Name, Area of Support → skills, etc.)
2. **Manual JSON** — `{ "email", "name", "skills", "message", "timezone", "availability", "source" }`

**Verify:**

```bash
curl -sS -X POST "$NEXT_PUBLIC_APP_URL/api/webhooks/volunteer" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: $VOLUNTEER_WEBHOOK_SECRET" \
  -d '{"email":"test@example.com","name":"Test","source":"curl"}'
```

| Response | Meaning |
|----------|---------|
| `401 Unauthorized` | Wrong/missing secret header |
| `400 email is required` | Auth OK; fix body mapping |
| `200 ok:true` | Application stored as `pending_review` |
| `409` | Email already has **active** account |

**Admin review:** `/admin/volunteers` — Activate (assign role) / Reject / Delete.

Full Fillout steps: [docs/volunteer-webhook.md](./docs/volunteer-webhook.md).

---

## File map (high-signal)

### Home & feed

| File | Role |
|------|------|
| `app/page.tsx` | Home server component, data loading |
| `components/home-composer.tsx` | Composer trigger + portal modal |
| `components/dua-form.tsx` | Submit form, language mode, category |
| `components/dua-list.tsx` | Feed rows, actions, flag UI |
| `components/home-stream-tabs.tsx` | Feed / channels tabs |
| `components/home-sidebar-nav.tsx` | Left nav |
| `components/home-right-rail.tsx` | Right column |
| `app/actions/duas.ts` | CRUD, pray, flag, feed queries |
| `lib/detect-language.ts` | Arabic/RTL detection |

### Admin

| File | Role |
|------|------|
| `app/admin/page.tsx` | Dashboard |
| `app/admin/volunteers/page.tsx` | Volunteer queue |
| `components/admin/admin-volunteers-list.tsx` | Activate/reject/delete |
| `lib/admin-permissions.ts` | RBAC permission keys |
| `lib/admin-nav-links.ts` | Sidebar nav |

### Volunteer & integrations

| File | Role |
|------|------|
| `app/api/webhooks/volunteer/route.ts` | Webhook handler |
| `lib/volunteer-webhook-parse.ts` | Fillout + JSON parser |
| `lib/volunteers.ts` | Register applicant, notify outbound |
| `lib/fillout.ts` | Embed URL + postMessage origin |
| `components/volunteer/volunteer-apply-section.tsx` | Public volunteer page + modal |
| `components/admin/integration-*.tsx` | Admin integration hub tabs |

### Infra scripts

| File | Role |
|------|------|
| `scripts/dev-persistent.sh` | Managed dev server |
| `scripts/deploy-prod.sh` | /tmp prebuilt production deploy |
| `scripts/apply-supabase-email-templates.sh` | Push auth email HTML to Supabase |
| `scripts/setup-database.mjs` | Run migrations |

### Cursor rules

| File | Role |
|------|------|
| `.cursor/rules/local-ui-iteration.mdc` | Dev server DO NOT rules |
| `.cursor/rules/deploy-on-complete.mdc` | Auto deploy on task done |
| `.cursor/rules/editorial-line.mdc` | Copy tone |
| `.cursor/rules/agent-handoff.mdc` | Pointer to this file |

---

## Maintenance

**`AGENTS.md` is a living handoff**, not a one-time doc — update it as part of finishing substantive work.

Agents **must** update this file when completing significant features, deploy/webhook changes, schema migrations, or new pitfalls; keep **Completed features** and **DO NOT** current.

---

## Verification checklist (before marking done)

- [ ] Dev left running on 3000 if user was iterating (did not kill/restart/build)
- [ ] `npx tsc --noEmit` or lint if TS changed
- [ ] Migrations documented/applied if schema changed
- [ ] No secrets in committed files
- [ ] Production deploy only when task complete and user/rules expect it
- [ ] Copy follows editorial line (neutral platform)

---

*Last updated: 2026-06-09 — volunteer webhook, feed redesign, dev/deploy pitfalls.*
