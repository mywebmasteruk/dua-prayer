# Re-Audit — DuaPrayer (2026-06-10, evening)

Scope: current state after the morning audit's fixes (Phases 0–3, see `fix-plan-handoff.md`) plus ~25 newer commits (`22f79fd..HEAD`: account dock, beta banner, composer copy, share payloads, Fillout-only channel applications, webhook secret admin controls, AI moderation in progress) and uncommitted working-tree changes.

**Headline: no critical or high-severity security issues.** All Phase 0–1 security fixes were spot-checked and are intact (RLS lockdown, safe redirects, checkout protection, Stripe webhook signature verification, secrets out of the data cache, timing-safe compares, flagDua validation). The banner rich-text feature — the prime XSS suspect — is clean: no `dangerouslySetInnerHTML` anywhere, hrefs whitelisted, colors regex-gated, founder-only writes.

---

## Fix first

### S1 (MEDIUM, security) — Channel webhook attributes applications to arbitrary users by unverified email
`lib/channel-applications.ts:121` — `applicantUserId = input.applicantUserId ?? (await findUserIdByEmail(applicantEmail))`. The Fillout form is public and the email is attacker-controlled, so an anonymous submitter can claim any registered user's email: the resulting `pending_review` channel gets `owner_id` = victim, and (via the one-pending-application unique index) can even block the victim from applying themselves.
**Fix:** never resolve `owner_id` from webhook email lookup — set it only from a verified session (in-app path) or leave null for webhook submissions until admin review links it. Also: `app/channels/apply/page.tsx` passes `filloutSrc` to anonymous visitors (auth gate is client-side only) — only pass it when `user` is non-null.

### C1 (HIGH, correctness) — Infinite server-action fetch loop in progressive feed loading
`components/feed-section.tsx:156-179` — the batch loader stops on `allDuas.length >= total`, but `total` is the stale prop and `result.total` from each fetch is discarded. If duas get unpublished after page render (or a batch returns only duplicates), loaded count plateaus below stale total → the effect re-fires forever (each call = 3 Supabase queries).
**Fix:** stop when `result.duas.length === 0`, and track live total from `result.total`.

### C2 (HIGH, correctness) — Redirect loop for signed-in non-admin users visiting /admin
`app/admin/page.tsx:30` + `components/inner-page-layout.tsx:43` redirect non-admins to `/?signin=1&next=/admin`; `app/page.tsx:75-78` sees a signed-in user with the modal open and bounces back to `/admin` → ERR_TOO_MANY_REDIRECTS.
**Fix:** in `app/page.tsx`, only redirect to `/admin` after confirming the user actually has admin access (or use `signInHref({ error: "not_admin" })` without `next` in the admin guards).

### C3 (HIGH, build-breaker) — Uncommitted `lib/site-copy.test.ts` fails tsc
Line 51: `Record<ComposerCopyKey, string>` requires all 19 composer keys but the literal supplies 5 (TS2739). With build-time type checking re-enabled, the next `next build` fails.
**Fix:** type as `Partial<Record<ComposerCopyKey, string>>`. (Note: tsc was clean at audit time mid-edit — verify against the final state of the parallel session's work.)

## Medium

| # | Finding | Location | Fix |
|---|---------|----------|-----|
| M1 | `?page=N` deep links clobbered on mount: `useEffect(() => setPage(1), [searchQuery])` runs on first render and overwrites the URL-derived page | `components/feed-section.tsx:197-199` | First-run ref guard, or reset inside the search-change handler |
| M2 | Offset-based batch loading silently skips a row when a loaded dua is deleted/unpublished (rows shift up past the fetched window) | `feed-section.tsx:163` + `duas.ts:272` | Keyset cursor: `lt("created_at", lastLoaded)` instead of offset |
| M3 | Any active filter (even one search keystroke) loads the entire published corpus in sequential 100-row batches, each re-running `enrichDuas` | `feed-section.tsx:158` | Server-side category filter via `getDuas`; debounce search; cap or lazy-load for text filters |
| M4 | Following tab still only sees the newest 100 duas (no batch loading there) — followed-channel duas older than that are unreachable | `components/following-section.tsx` | Reuse the feed's batch loading, or fetch followed-channel duas server-side |
| M5 | Homepage hardcodes the sidebar tagline while every other page uses admin-editable `siteCopy.sidebarTagline` | `app/page.tsx:119` | Pass `siteCopy.sidebarTagline` |
| M6 | AI moderation fails closed: any provider error/timeout sends EVERY submission to `published: false, flagged: true` with no admin alert — an OpenAI outage silently dark-holes all duas | `lib/ai-moderation.ts:246-254` + `app/actions/duas.ts` (uncommitted) | Confirm the tradeoff; distinguish transient provider errors (fail open or alert) from real "review" verdicts |
| M7 | 11 `node:test` unit-test files have no runner — no script, no jest/vitest config, Playwright scoped to e2e/ — they never execute | `lib/*.test.ts(x)`, `components/*.test.ts` | Add `"test:unit": "node --experimental-strip-types --test ..."` (Node 22+) or vitest; wire into the verification gate |
| M8 | Dead code from the Fillout-only change: `components/channels/channel-apply-form.tsx` (zero importers) + its only consumer, the `submitChannelApplication` action | `channel-apply-form.tsx`, `app/actions/channel-applications.ts:83` | Delete both |
| M9 | `e2e/auth.spec.ts:96` asserts "Signed in" text that no longer renders (replaced by AccountDock) — env-gated so it silently skips in normal runs and fails when actually exercised | `e2e/auth.spec.ts` | Drop the assertion; the "Open account settings" check covers the dock |

## Low

- L1 Pending-application check in `submitChannelApplication` uses the RLS client then inserts via service role — unreliable friendly error (unique index backstops it). Use admin client for the check.
- L2 Outbound notify webhooks POST applicant PII with no HMAC/shared-secret header — receiver can't verify origin (`lib/channel-applications.ts:19-36`, same for volunteer).
- L3 Channel webhook 400s echo `receivedKeys` to callers (debug info; caller already authenticated).
- L4 Sign-out errors swallowed in `components/auth/account-dock.tsx:37-41`.
- L5 `app/channels/apply/page.tsx:26` renders "no pending application" on fetch error (cosmetic; index backstops).
- L6 `HomeSidebarNav` accepts `isAdmin` but never uses it (half-wired; admin link derived from email pattern instead).
- L7 Pre-existing orphans missed in Phase 3: `components/header-actions.tsx`, `hooks/use-mobile.tsx`, `lib/types/database.ts`; dead `eyebrow` field in `lib/user-nav.ts:48`.
- L8 `E2E_LOGIN_EMAIL`/`E2E_LOGIN_PASSWORD` undocumented in `.env.example`.
- L9 e2e composer assertions test DB-backed copy — admin edits to copy in prod will break `test:e2e:prod`.
- L10 `lib/dua-share.ts:1` hardcodes `https://duaprayer.com` (only hardcoded URL in the app — fine if canonical, note it).
- L11 Handoff doc stale: admin identity is now hard-coded in `lib/admin-policy.ts` (`webmaster@duaprayer.com`), not `SUPER_ADMIN_EMAIL` env.

## Verified clean
- Banner rich text (XSS-safe by construction), webhook secret admin UI (no secret values to client, last-4 only), share URL construction (encoded, no injection), composer copy threading (all 19 keys wired), AI moderation API key not anon-readable (site_settings RLS whitelist), all admin actions permission-gated, no new `NEXT_PUBLIC_` secrets, package.json unchanged since pinning, `.env.example` still in sync for app code.

## Suggested order of work
1. **S1** ownership-by-email fix (security) + server-side gate on `filloutSrc`.
2. **C1, C2, C3** — the two loops and the build-breaking test file.
3. **M1–M5** feed/UX correctness batch; **M6** decision on moderation failure mode (product call).
4. **M7** unit-test runner, then **M8, M9** + lows in a hygiene pass.
