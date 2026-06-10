# Fix Plan & Handoff — DuaPrayer Hardening (2026-06-10)

**Context:** A full code audit was performed on 2026-06-10 — see [`docs/audit-2026-06-10.md`](./audit-2026-06-10.md) for every finding with file:line evidence. The decision (made with the founder) was: **do NOT restart on a SaaS boilerplate**; instead do a "foundation rebuild in place" — fix all audit findings, adopt official Stripe/Supabase patterns where ours are weak, and install guardrails (type checking, pinned deps, CI gates).

**This document is the working plan + progress tracker.** Each task below has concrete instructions. Work top-to-bottom. After each phase: run the Verification Gate (bottom of doc) and make a git commit.

---

## Status legend
- ✅ DONE — completed and verified
- 🔶 STARTED — partially done, see notes
- ⬜ TODO — not started

---

## Phase 0 — Critical security (do first)

### 0.1 ✅ DONE (file written, ⬜ NOT YET APPLIED TO PROD) — Block privilege escalation on `profiles`
**Problem (CRITICAL):** `profiles_update_own` policy (`supabase/migrations/20250608000000_initial_schema.sql:176-177`) restricts rows but not columns. Any authenticated user can run `update profiles set is_admin=true where id=auth.uid()` via the public anon key, bypassing all server-side permission checks (`is_admin`, `admin_role`, `admin_permissions`, `member_role`, `account_status` all live on `profiles`).

**Done:** Created `supabase/migrations/20260610090000_lock_privileged_profile_columns.sql`:
```sql
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, updated_at) ON public.profiles TO authenticated;
```
Safe because: all profile writes in the app go through service-role server actions (verified — every `from("profiles")` write is in `app/actions/*` or `lib/*` using the admin client); profile creation is via the SECURITY DEFINER trigger `handle_new_user` (unaffected); there is no INSERT/DELETE policy on profiles anyway.

**Remaining:**
1. Apply to production: Supabase Dashboard → SQL Editor → paste the migration, or `node scripts/setup-database.mjs` (applies all files in `supabase/migrations/` via direct Postgres; needs DB connection env — see script header), or `supabase db push` if CLI is linked.
2. Verify: as a normal signed-in user with the anon-key client, `update profiles set is_admin=true` must FAIL; updating own `display_name` must still work.

### 0.2 ✅ DONE — Fix open redirect via `next` param
**Problem (HIGH):** `app/auth/callback/route.ts` and `app/actions/auth.ts` accepted an absolute URL in `next` (e.g. `?next=https://evil.com`) — `new URL(next, origin)` and `redirect(next)` both follow it. Phishing vector on magic-link sign-in.

**Done:** Added `lib/safe-redirect.ts` (`safeNextPath`: only paths starting with exactly one `/`, rejects `//` and `/\`). Applied in `app/auth/callback/route.ts` (next param), `app/actions/auth.ts` `signIn` and `sendMagicLink`. tsc clean.
**Remaining verify (manual):** `/auth/callback?code=...&next=https://evil.com` and `?next=//evil.com` land on `/`.

### 0.3 ⬜ TODO (USER ACTION) — Rotate admin password
`ADMIN_CREDENTIALS.txt` is gitignored/untracked but the project lives in iCloud Drive, so the plaintext password syncs to cloud storage. Rotate `admin@duaprayer.app`'s password in Supabase Auth dashboard; don't store the new one in a synced plaintext file. (Longer term: move repo out of iCloud Drive — file sync + node_modules/.git is also a stability risk. Note: local disk is ~99% full; that caused one tool failure during this session.)

---

## Phase 1 — Security & payments

### 1.1 ⬜ TODO — Protect `/api/checkout` (rate limit + Turnstile) and PaymentIntent metadata
`app/api/checkout/route.ts:16` creates Stripe Checkout Sessions with no rate limit/Turnstile (card-testing/spam abuse). Mirror the pattern in `createDua` (`app/actions/duas.ts:296-307`): `checkRateLimit(\`checkout:${ip}\`, ...)` (lib/rate-limit.ts) + `verifyTurnstile` (lib/turnstile.ts) — Turnstile token must be passed from `components/donate-form.tsx` (render `components/turnstile-widget.tsx` in the form).
Also (audit M3): for the one-time `mode: "payment"` branch (route lines ~84-115), add `payment_intent_data: { metadata }` — currently metadata is only on the session, so charges show no package/amount in Stripe reporting.

### 1.2 ⬜ TODO — Add Stripe webhook route
No `app/api/webhooks/stripe/route.ts` exists although admin UI stores/validates `whsec_` secrets (`lib/stripe-settings-server.ts:270` has `getStripeWebhookSecret()`). Subscription failures/cancellations are currently invisible.
Create the route: read RAW body (`await req.text()`), verify with `stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)`, handle at minimum: `checkout.session.completed`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`. Crib structure from Stripe's official Next.js sample (stripe-samples/checkout-one-time-payments or subscription-use-cases). Get the Stripe client the same way `app/api/checkout/route.ts` does (`lib/stripe.ts`). Log/store events minimally for now (no donations table exists yet — at minimum console.log + 200; consider a `donations` table migration as follow-up).

### 1.3 ⬜ TODO — Stop caching Stripe secrets in the Next data cache
`lib/stripe-settings-server.ts:155-159`: `unstable_cache(fetchStripeSettingsFromDb, ["stripe-settings"], { tags: ["stripe-settings"] })` serializes `secretKey`/`webhookSecret` into the shared (on Vercel, remote) data cache. Split: cache only non-secret display fields (mode, last4, readiness); fetch secrets fresh per request (they're one small DB read) or hold in a module-level in-memory variable with manual invalidation on the existing `revalidateTag("stripe-settings")` path (`app/actions/stripe-settings.ts`).

### 1.4 ⬜ TODO — Fix flag/unflag
`app/actions/duas.ts:365-383` (`flagDua`): anonymous, service-role, no existence check; and `components/dua-list.tsx:170-176,206`: "Unflag" only flips local state (DB stays flagged) and is shown to all visitors on server-flagged duas.
Fix: in `flagDua`, first verify the dua exists and is published before updating; keep anonymous flagging (it's intentional) but remove the unflag affordance for non-admins in `dua-list.tsx` (the local `reportedDuas` state should not offer "Unflag" when `dua.flagged` came from the server).

### 1.5 ⬜ TODO — Timing-safe webhook secret comparison
`app/api/webhooks/channel/route.ts:~63` and `app/api/webhooks/volunteer/route.ts:~65` use `providedSecret !== configuredSecret`. Replace with `crypto.timingSafeEqual` (hash both sides with sha256 first to equalize length):
```ts
import { createHash, timingSafeEqual } from "crypto"
const a = createHash("sha256").update(providedSecret).digest()
const b = createHash("sha256").update(configuredSecret).digest()
if (!timingSafeEqual(a, b)) { /* 401 */ }
```

### 1.6 ⬜ TODO — Re-enable build-time type checking
1. `npm i -D @types/ws` (fixes the only current tsc error, from `lib/supabase/admin.ts:2`).
2. Remove `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true` from `next.config.mjs`.
3. `npx tsc --noEmit` and `npm run build` — fix anything that surfaces.

---

## Phase 2 — Correctness

### 2.1 ⬜ TODO — Real feed pagination + consistent stats
- `app/actions/duas.ts:262`: `FEED_BATCH_SIZE = 100` + `components/feed-section.tsx:131-137` paginate client-side over the newest 100 → duas beyond 100 unreachable. The server-paginated `getDuas()` (`duas.ts:33`) exists but is unused. Wire `FeedSection` pagination to server-side fetching (page param → `getDuas({ page, category, ... })`), use the real `count` for `total`.
- While there: guard `app/actions/duas.ts:46-48` — `Number.parseInt(options.category)` can produce `NaN` → PostgREST error → empty feed. Use `Number.isInteger(Number(options.category))` check before `.eq()`.
- `app/page.tsx:71-80`: `totalAmeens`/leaderboard computed from the 100-row slice while `totalDuas` is the true count — compute ameens from `getPlatformStats` (`lib/platform-stats-server.ts`) instead.
- `components/following-section.tsx:31-34` + `components/feed-section.tsx:50-55`: both read the same `?page=` param regardless of active tab — namespace them (`?page=` for feed, `?fpage=` for following) or read only when the section's tab is active.

### 2.2 ⬜ TODO — Validate `category_id` in `createDua`
`app/actions/duas.ts:330-337` inserts client-supplied `category_id` via service role with no check — can post into pending/rejected/inactive channels. Validate the id exists in approved+active categories (one select) before insert.

### 2.3 ⬜ TODO — Tighten Fillout submission-id extraction
`lib/channel-webhook-parse.ts:118-124`: `extractSubmissionId` falls back to `asString(flat.id)` — any constant `id` in the payload (e.g. form id) makes every application dedupe-match the first one and get silently dropped (`lib/channel-applications.ts:118-130` returns `created:false`). Remove the generic `id` fallback; accept only explicit `submissionId`/`submission_id` keys. Check whether `lib/volunteer-webhook-parse.ts` has the same pattern and fix it too.

### 2.4 ⬜ TODO — Fix read-then-write races
- Duplicate pending applications on double-submit: `app/actions/channel-applications.ts:113-127` checks-then-inserts. Add migration: `CREATE UNIQUE INDEX ... ON channel_applications (owner_id) WHERE status = 'pending_review';` and handle the unique-violation error as "you already have a pending application".
- `sort_order` max-then-write in `app/actions/channel-applications.ts:290-297` and `app/actions/admin-channels.ts:126-133`: compute in the statement, e.g. insert with `sort_order = (select coalesce(max(sort_order),0)+1 ...)` via an RPC, or accept the benign race and leave a comment.

### 2.5 ⬜ TODO — Surface swallowed `updateUserById` errors
`app/actions/volunteers.ts:158-160, 186-191, 320-322`: result of `admin.auth.admin.updateUserById(...)` (app_metadata sync) is unchecked → silent divergence between `profiles` and `app_metadata`. Capture `{ error }` and return failure if set.

### 2.6 ⬜ TODO — Turnstile robustness
- `components/dua-form.tsx:79-90`: after successful submit, call `window.turnstile.reset(widgetId)` (expose widget id from `turnstile-widget.tsx`), not just `setTurnstileToken(null)`.
- `components/turnstile-widget.tsx:24-43`: register `"expired-callback"` → clear the token so the form disables submit instead of failing server-side; fix the `window.onTurnstileLoad` global being overwritten per instance (line ~33) — keep an array of pending callbacks.

### 2.7 ⬜ TODO — Fix donate-form toasts (user-visible bug)
`components/donate-form.tsx:16` imports `useToast` from `@/hooks/use-toast`, but the mounted `<Toaster/>` (`app/layout.tsx` → `components/toaster.tsx`) subscribes to the duplicate store in `components/ui/use-toast`. Donate-form toasts never render. Change the import to `@/components/ui/use-toast`, then delete `hooks/use-toast.ts` (and dead `components/ui/toaster.tsx`, `components/ui/sonner.tsx`).

### 2.8 ⬜ TODO — Rate limiter hygiene
`lib/rate-limit.ts:1-20`: in-memory Map is per-serverless-instance (limit multiplies by concurrency) and never prunes. Minimum: sweep expired buckets on each call. Better: Upstash Redis (free tier) keyed limiter. Decide based on traffic; document the choice in the file.

### 2.9 ⬜ TODO — Small fixes
- `app/api/webhooks/volunteer/route.ts:104-111`: only send `volunteer.application.created` when `result.created === true` (mirror the channel route's guard at `channel/route.ts:117-126`).
- `lib/types/dua.ts:10` + `components/dua-list.tsx:204`: remove phantom `user_has_liked` field/fallback (never populated).
- `lib/channels.ts:11-15`: pass stored handles through `normalizeChannelHandle` (from `lib/channel-types.ts:38-49`) so display matches write-time normalization.
- `components/dua-list.tsx:70-75`: include the year in the date format when not the current year.
- Extract one shared `listAllUsers` helper for the five duplicated `auth.admin.listUsers` pagination loops (`app/actions/volunteers.ts:35-58`, `app/actions/channel-applications.ts:21-44`, `app/actions/admin-users.ts:29-56`, `app/actions/admin-roles.ts:171-184`, `lib/channel-applications.ts:47-62`).

---

## Phase 3 — Hygiene

### 3.1 ⬜ TODO — Dependencies
- `package.json`: replace the four `"latest"` specifiers (`@radix-ui/react-toast`, `@supabase/ssr`, `@supabase/supabase-js`, `next-themes`) with the exact versions currently resolved in `package-lock.json`.
- Delete `pnpm-lock.yaml` (it's an empty 92-byte stub; everything uses npm). Then remove the `rm -f pnpm-lock.yaml` workaround in `.github/workflows/deploy-vercel.yml`. Update `README.md:15-17` from pnpm to npm.

### 3.2 ⬜ TODO — `.env.example`
Add (read in `lib/stripe-settings-server.ts:81-84`): `STRIPE_TEST_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY`, `STRIPE_TEST_WEBHOOK_SECRET`, `STRIPE_TEST_DONATION_PRODUCT_ID`. Remove (never read by code): the 10 `STRIPE_PRICE_DONATION_*` vars.

### 3.3 ⬜ TODO — Dead code purge (all verified never-imported)
App components: `components/header.tsx`, `theme-toggle.tsx`, `home-mobile-header.tsx`, `home-sidebar-toolbar.tsx`, `navigation-content-spinner.tsx`, `admin/stripe-settings.tsx`, `admin/admin-nav.tsx`, `admin/integration-volunteer-webhook-tab.tsx`, `admin/integration-channel-webhook-tab.tsx`, `ui/toaster.tsx`, `ui/sonner.tsx`.
(NOT dead: `admin/admin-sidebar-nav.tsx`, `admin/admin-mobile-nav.tsx` — used via relative imports in `inner-page-layout.tsx`.)
Unused shadcn kit (~33 files in `components/ui/` — accordion, avatar, badge, calendar, carousel, chart, command, drawer, form, hover-card, input-otp, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, sidebar, slider, toggle-group, use-mobile, etc.) — re-verify each with a grep for imports before deleting, then prune now-unused deps: `react-hook-form`, `@hookform/resolvers`, `zod`, `recharts`, `embla-carousel-react`, `vaul`, `input-otp`, `cmdk`, `react-day-picker`, `date-fns`, `react-resizable-panels`, `sonner`.
Also delete dead `styles/globals.css` (drifted v0 copy; `app/globals.css` is the live one, imported in `app/layout.tsx:4`).

### 3.4 ⬜ TODO — Config cleanup
- `tsconfig.json`: remove machine-specific `/tmp/dua-prayer-*` absolute include paths; keep `.next/types/**/*.ts`.
- `package.json`: dedupe identical scripts (`dev`≡`dev:persistent`, `dev:foreground`≡`dev:stable`).
- `scripts/pending-admin-migrations.sql`: confirm whether applied; fold into a timestamped migration or delete.
- Archive or delete `../test-dua-app` (stale original v0 export, nothing references it).

---

## Verification gate (run after every phase)
```bash
cd apps/dua-prayer
npx tsc --noEmit          # must be clean
npm run build             # must pass (after 1.6, with ignoreBuildErrors removed)
npx playwright test       # e2e: e2e/auth.spec.ts, e2e/home.spec.ts
```
Manual checks per task are listed inline above. Commit at each phase boundary with a message like `security: phase 0 — RLS column lockdown + open redirect fix`.

## Key architecture notes for whoever continues
- **Three Supabase clients:** `lib/supabase/client.ts` (browser, anon key), `lib/supabase/server.ts` (SSR, cookie-bound), `lib/supabase/admin.ts` (service role — RLS bypass; only use after permission checks).
- **Permission model:** `lib/auth.ts` (founder via `SUPER_ADMIN_EMAIL` env), `lib/admin-permissions.ts` (`requirePermission`/`getAdminContext`) — every admin server action already gates correctly; keep that invariant.
- **Migrations:** plain SQL files in `supabase/migrations/`, applied via dashboard SQL editor or `scripts/setup-database.mjs`. No drift tracking — apply in filename order.
- **Deploy:** Vercel via `.github/workflows/deploy-vercel.yml` (npm, `--legacy-peer-deps`); git deploys disabled in `vercel.json`.
- **Abuse protection pattern to copy:** `app/actions/duas.ts:296-307` (rate limit + honeypot + Turnstile).
