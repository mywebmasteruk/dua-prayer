# Deploy to production

Reliable production deploys **must not** run `vercel deploy` from the iCloud/CloudDocs project path — uploads balloon to ~171MB and deployments often hang in `UNKNOWN`.

## Recommended: push to main (GitHub Actions)

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

- **https://dua-prayer.vercel.app**

## Do not

- Run `vercel deploy` from the iCloud-synced project folder
- Commit `.vercel/` (contains project IDs; copy is handled by `deploy-prod.sh`)
- Rely on blocked git author `youare@mywebmaster.co.uk` for team deploys when uploading full source — use prebuilt deploy or GitHub Actions instead
