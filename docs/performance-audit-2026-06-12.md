# Performance Audit & Improvement Plan — DuaPrayer (2026-06-12)

User report: pages slow to load, navigation slow. Audited via (a) static analysis of every data-fetching path and (b) real measurements against the production site and a local production build.

## Measurements (evidence)

| Probe | Result |
|---|---|
| Production home TTFB (from UK) | **0.9–1.0s**, total 1.5–1.7s |
| Apex redirect `duaprayer.com` → `www.` | +0.4–0.6s serial 308 before anything renders |
| **Vercel function region** | `x-vercel-id: lhr1::iad1` — edge London, **function Washington DC (iad1, the default)** |
| Supabase region | **eu-west-1 (Ireland)** — every DB query from iad1 crosses the Atlantic (~90ms RTT each) |
| Local prod build: `/` | 0.6–0.9s (vs `/about` 45ms — DB-free) |
| Local prod build: `/channels` | 0.5–0.7s |
| Single Supabase REST round trip (from this Mac) | ~405ms |

## Root causes, ranked

### 1. Region mismatch: functions in iad1, database in eu-west-1 (HIGH — fix is one line)
Every page render makes 6–10 Supabase calls; several are **sequential**. Each crosses the Atlantic twice. Pinning the function region next to the DB cuts each hop from ~90ms to ~1–5ms.
**Fix:** `vercel.json`: `"regions": ["dub1"]` (Dublin = same AWS region as Supabase eu-west-1). Redeploy. Expected: TTFB drops by 400–700ms on every dynamic page.

### 2. Sequential query waterfall on the home page (HIGH)
~10 Supabase round trips per anonymous request, ~6 deep on the critical path:
middleware `auth.getUser()` → page `auth.getUser()` (not the `cache()`-deduped `getServerUser`) → duas select → `enrichDuas`: ALL categories → bot-post markers → a THIRD `auth.getUser()` → user's ENTIRE `dua_prayers` history (no `.in(dua_id)` filter, no supporting index).
**Fixes:**
- Use `getServerUser()` (`lib/server-user.ts`, already React-`cache()`d) everywhere raw `supabase.auth.getUser()` appears: `app/page.tsx:76`, `app/channels/page.tsx:64`, channels apply loader, `enrichDuas` (`app/actions/duas.ts:226`).
- `enrichDuas`: run categories ∥ bot-posts ∥ prayers in one `Promise.all`; add `.in("dua_id", duaIds)` to the prayers query.
- Wrap `getCategories` in React `cache()` — it's fetched 3× per home request.

### 3. Middleware does a network auth call on (almost) every request (HIGH for signed-in users)
`middleware.ts:24` runs `supabase.auth.getUser()` — a remote round trip to Supabase Auth — and the matcher excludes only static assets. Every navigation, RSC prefetch, server action, and API call pays it when a session cookie is present.
**Fix:** use the local-validation pattern (`getClaims()` / check JWT exp locally, refresh over network only when near expiry), and narrow the matcher to routes that need sessions (e.g. exclude `/api/webhooks/*`, sitemap, public assets).

### 4. Full-table scans aggregated in JS (HIGH — grows with data)
- `getTopCategories` (`app/actions/duas.ts:307`): selects `category_id` of every published dua, counts in JS, every home render, uncached.
- `getPlatformStats` (`lib/platform-stats-server.ts:14`): selects `likes` of every published dua, sums in JS (cached 60s, still a full scan per refresh).
- `lib/channels.ts` channel counts: computed from only the newest 100 duas — wrong AND wasteful.
**Fix:** one Postgres function (RPC): `SELECT category_id, count(*), coalesce(sum(likes),0) FROM duas WHERE published GROUP BY 1` + totals; call it in `unstable_cache(60s)`; use it for top-categories, platform stats, channel counts, and the right-rail leaderboard.

### 5. Missing indexes for hot queries (MEDIUM-HIGH)
- `dua_prayers(user_id)` and `dua_prayers(voter_hash)` — `enrichDuas` filters by these alone; existing unique indexes lead with `dua_id`, so these are sequential scans **on every feed render**.
- `dua_bot_event_posts(dua_id)` — `.in("dua_id", ...)` lookup has no index.
**Fix:** migration with the three indexes.

### 6. NavigationContentLoader blanks the page during every nav (MEDIUM, perceived)
`components/navigation-content-loader.tsx` hides already-rendered content (`invisible`) and shows a spinner the moment a link is clicked, until the new route settles (+120ms) — so users stare at a blank pane for the full server round trip on every navigation; fallback timeout is 12s. This amplifies every server-side delay and defeats Next prefetching.
**Fix:** keep current content visible (dim it slightly at most), rely on route-level `loading.tsx` / `useLinkStatus`; reduce fallback to ~5s.

### 7. Apex → www redirect (MEDIUM, first visit)
Every visit to `duaprayer.com` pays a serial 308 (~0.4–0.6s) before the page even starts.
**Fix:** nothing to code — prefer `www.` in all links/marketing; optionally serve the apex directly and redirect `www→apex` instead (pick one canonical; configured in Vercel domains).

### 8. Dua submission latency: synchronous AI moderation (HIGH for submit UX)
`createDua` runs Turnstile → auth → category validation → moderation settings fetch → **AI call with 8s timeout** before inserting. Submit can take up to ~10s.
**Fix:** insert first (`published:false` pending verdict or optimistic), moderate async (Vercel `waitUntil`) and flip flags; or cut timeout to ~3s with the existing local-pattern fallback.

### 9. Admin pages: `listAllAuthUsers` sequential pagination (MEDIUM, admin-only)
3 admin actions walk the entire Auth admin API 200 users/page in series; plus `getAdminDuas` selects all duas unbounded, and `app/admin/page.tsx` fetches sequentially.
**Fix:** mirror email onto `profiles` at signup (trigger already exists — add the column) and read from there in one query; `Promise.all` the admin page fetches; paginate/limit `getAdminDuas`.

### 10. Misc (LOW)
- `favicon.png` / `logo-icon.png` are 112KB each — compress to ~10KB.
- `images.unoptimized: true` — fine today (no user images), revisit if user images arrive.
- New-duas poll every 45s per tab is cheap but pays the middleware auth hit (see #3).
- `customCode.header` admin-injected scripts — audit whatever is pasted there; it runs on every page.

## What was checked and is already good
- `inner-page-layout.tsx` fetches in parallel with `cache()` dedupe; fonts via `next/font` (self-hosted); no heavy client deps; site copy / platform stats / fillout / custom code / banner are `unstable_cache`d; donate and volunteer pages are nearly free.

---

# Improvement plan

## Phase P0 — Config-only, deploy today (expected: −0.5 to −1.0s on every page)
1. `vercel.json`: add `"regions": ["dub1"]`. Redeploy. Re-measure `x-vercel-id` (expect `lhr1::dub1`).
2. Compress `public/favicon.png` and `public/logo-icon.png`.

## Phase P1 — Waterfall fixes (expected: home TTFB ~0.3s in-region)
3. `getServerUser()` everywhere; remove the 2 duplicate auth round trips.
4. `enrichDuas`: Promise.all + `.in("dua_id", duaIds)` + `cache()`d categories.
5. Migration: 3 missing indexes (apply to prod).
6. Middleware: local JWT validation + narrowed matcher.

## Phase P2 — SQL aggregates + perceived speed
7. RPC `dua_category_stats()` + `unstable_cache`; replace getTopCategories/getPlatformStats/channel counts/leaderboard sources.
8. NavigationContentLoader: stop hiding content; 5s fallback.
9. Decide & implement submit path: async moderation (preferred) or 3s timeout.

## Phase P3 — Admin + structural (when convenient)
10. Email mirrored on `profiles`; retire `listAllAuthUsers` from list pages.
11. `Promise.all` + limits on admin queries.
12. Optional: ISR (`revalidate: 30`) for anonymous public pages with client-hydrated auth state — biggest possible win for anonymous traffic, medium effort/risk.

## Verification per phase
- `npx tsc --noEmit`, `npm run build`, e2e on a quiet tree.
- Re-measure: `curl -w` TTFB ×3 on `/`, `/channels` locally and on production; confirm `x-vercel-id` region; compare to the table above.
