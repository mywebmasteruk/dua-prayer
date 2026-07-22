# Deploy to production

Reliable production deploys **must not** run `vercel deploy` from the iCloud/CloudDocs project path — uploads balloon to ~171MB and deployments often hang in `UNKNOWN`.


## Fix Git deploy blocked (COMMIT_AUTHOR_REQUIRED / TEAM_ACCESS_REQUIRED)

Vercel **Git** deployments (push → Vercel builds from GitHub) require the **commit author** to be a member of the Vercel team. Commits authored as `youare@mywebmaster.co.uk` are blocked until that identity is on the team.

**Symptoms:** Production deploy fails in the Vercel dashboard with `COMMIT_AUTHOR_REQUIRED` or `TEAM_ACCESS_REQUIRED` for `youare@mywebmaster.co.uk`.

### Option A — Fix native Git deploy (one-time team access)

1. Open **[Vercel → your team → Settings → Members](https://vercel.com/account)** (select the team that owns **dua-prayer**, then **Settings → Members**).
2. **Invite** `youare@mywebmaster.co.uk` (or the GitHub user linked to that email) with at least **Developer** access.
3. On **GitHub**: [Settings → Emails](https://github.com/settings/emails) — enable **Keep my email addresses private** and use a GitHub-owned address for commits, e.g. `noreply@users.noreply.github.com` (or your `{id}+{username}@users.noreply.github.com` address shown on that page).
4. New commits should use that GitHub noreply author so Vercel can match the author to a team member.

Do **not** change git config in the repo from automation; set commit identity in GitHub (web UI) or your local git user config yourself if needed.

### Option B — Recommended until Option A is done: GitHub Actions (bypasses author check)

Push to `main` triggers **Deploy Vercel Production** (`.github/workflows/deploy-vercel.yml`). That workflow deploys with `VERCEL_TOKEN` and `vercel deploy --prebuilt --prod` — **not** the Vercel Git “commit author” gate.

1. Ensure Actions secrets are set (see table below).
2. `git push origin main`
3. Watch **https://github.com/mywebmasteruk/dua-prayer/actions** — green run = production updated.

Use this as the **primary** deploy path until `youare@mywebmaster.co.uk` is on the Vercel team and native Git deploys succeed.


## Recommended: push to main (GitHub Actions)

**Primary path while Vercel Git author is blocked** — uses CLI token deploy, not Vercel Git integration.

Once secrets are configured, every `git push origin main` deploys automatically on GitHub’s runners (~2 min, no local CLI).

### One-time secret setup

1. Open **https://github.com/mywebmasteruk/dua-prayer/settings/secrets/actions**
2. Add repository secrets:

| Secret | Value |
|--------|--------|
| `VERCEL_TOKEN` | Create at [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | `team_km2T92NwivBy9c85XLjhTScR` |
| `VERCEL_PROJECT_ID` | `prj_8sQGGuKxXAfJdnHeRXuX0jh15dIk` |

3. Push to `main` — workflow `.github/workflows/deploy-vercel.yml` runs automatically.

Check runs: **https://github.com/mywebmasteruk/dua-prayer/actions**

## Local fallback: `npm run deploy:prod`

When GitHub Actions secrets are not set yet, or you need an immediate deploy:

```bash
npm run deploy:prod
```

This script (`scripts/deploy-prod.sh`):

1. Clones/updates `origin/main` to `/tmp/dua-prayer-deploy` (outside iCloud)
2. Copies the local `.vercel` link from this project
3. Strips `.git` (blocked git author causes UNKNOWN deploys on team projects)
4. Pins `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` from your local `.vercel/project.json`
5. Runs `npm ci`, `vercel build --prod`, `vercel deploy --prebuilt --prod`

Requires: `npx vercel whoami` succeeds (run `npx vercel login` once).

Typical timing: **~60–120s** after dependencies are cached (first run ~3–5 min).

## Vercel ↔ GitHub (optional native integration)

`npx vercel git connect` currently fails until a GitHub login connection is added to Vercel:

```
Error: You need to add a Login Connection to your GitHub account first.
```

**Fix (2 clicks):**

1. Open [vercel.com/account/authentication](https://vercel.com/account/authentication) → **Login Connections** → connect **GitHub** (authorize `mywebmasteruk`).
2. Open the [dua-prayer Vercel project](https://vercel.com/) → **Settings** → **Git** → **Connect Git Repository** → select `mywebmasteruk/dua-prayer` → branch `main`.

GitHub Actions above is the permanent fix even without this step.

## Production URL

- **https://dua-prayer.vercel.app** (canonical — use this)
- Do **not** use `dua-prayer-deploy.vercel.app` (orphan project, returns 404) or `*-git-main-*.vercel.app` preview aliases (Git builds were empty/broken).

## Vercel dashboard settings (project: `dua-prayer`)

Confirm in **Project → Settings → General**:

| Setting | Required value | Notes |
|---------|----------------|-------|
| **Root Directory** | `.` (empty / repo root) | GitHub repo `mywebmasteruk/dua-prayer` *is* the app — **not** `dua-prayer` unless you connected a parent monorepo |
| **Framework Preset** | Next.js | Auto-detected |
| **Build Command** | `npm run build` | Also in `vercel.json` |
| **Install Command** | `npm install --legacy-peer-deps` | Also in `vercel.json` |
| **Output Directory** | *(leave default / empty)* | Next.js — do **not** set to `out` or `.next` |
| **Node.js Version** | 20.x or 24.x | GitHub Actions uses 20; dashboard may show 24.x |

`vercel.json` sets `"git": { "deploymentEnabled": false }` so **Vercel Git push deploys are off**. Production updates come only from **GitHub Actions** (`vercel deploy --prebuilt --prod`) or **`npm run deploy:prod`**. Native Git deploys were creating **UNKNOWN** deployments with **0 ms builds** (no routes) → 404 on preview/git aliases and intermittent production issues.

### If you still see 404 after push

1. Check **Deployments** — production alias must be **Ready**, not **UNKNOWN**.
2. Redeploy: push to `main` (Actions) or run `npm run deploy:prod`.
3. Verify you are opening **https://dua-prayer.vercel.app**, not another Vercel project URL.

## Do not

- Run `vercel deploy` from the iCloud-synced project folder
- Commit `.vercel/` (contains project IDs; copy is handled by `deploy-prod.sh`)
- Rely on blocked git author `youare@mywebmaster.co.uk` for team deploys when uploading full source — use prebuilt deploy or GitHub Actions instead
