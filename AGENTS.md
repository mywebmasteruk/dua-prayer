# Agent instructions — DuaPrayer local dev

## Dev server must stay up during edits

The browser at `http://localhost:3000/` must keep responding while agents edit code. **HMR applies changes; do not restart dev to “verify” or “refresh”.**

### Forbidden during iteration (causes ERR_CONNECTION_REFUSED)

Never run any of these unless the **user explicitly** asks to restart dev:

- `kill`, `pkill`, `killall`, or `lsof -ti:3000 | xargs kill` (any variant on port **3000**)
- `kill … && npm run dev` or `rm -rf .next && npm run dev`
- Foreground `npm run dev` / `next dev` in a disposable agent terminal
- `npm run build` / `next build` (rewrites dist output and breaks a running dev server)
- `rm -rf .next` or clearing `/tmp/dua-prayer-next` without user approval

### Required behavior

1. **Before** any port or process operation: read `.dev-server.pid`. If that PID is alive, the managed supervisor is running — **do not stop or replace it**.
2. **Check health only**: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` — expect `200` (or `3xx`).
3. **Edit source files in place**; rely on Next.js Fast Refresh / HMR.
4. **Typecheck** with `npx tsc --noEmit` — not `npm run build`.
5. **Start dev** (only when down or user asks): `npm run dev:persistent` once — idempotent, detached supervisor with auto-restart.

See `.cursor/rules/local-ui-iteration.mdc` for the full policy.

## Deploy to production

**Never** run `vercel deploy` from this iCloud path — use one of:

1. **`git push origin main`** — GitHub Actions deploys to Vercel (preferred; see `DEPLOY.md` for one-time secrets).
2. **`npm run deploy:prod`** — clones to `/tmp/dua-prayer-deploy`, prebuilt Vercel deploy (~30–90s).

Full details: [DEPLOY.md](./DEPLOY.md)
