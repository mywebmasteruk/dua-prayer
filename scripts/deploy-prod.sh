#!/usr/bin/env bash
# Production deploy outside iCloud — clone to /tmp, prebuilt Vercel deploy.
# Avoids 171MB uploads and stuck UNKNOWN deploys from CloudDocs paths.
#
# Usage: npm run deploy:prod
# Requires: git, npm, vercel CLI auth (`npx vercel whoami`), linked .vercel in project root

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY_DIR="${DEPLOY_DIR:-/tmp/dua-prayer-deploy}"
BRANCH="${BRANCH:-main}"
STARTED_AT="$(date +%s)"

log() { echo "[deploy-prod] $(date -Iseconds) $*"; }
die() { log "ERROR: $*"; exit 1; }
step() { log "==> $*"; }

on_err() {
  local code=$?
  log "FAILED (exit $code) after $(( $(date +%s) - STARTED_AT ))s"
  exit "$code"
}
trap on_err ERR

REPO_URL="${REPO_URL:-}"
if [[ -z "$REPO_URL" ]]; then
  REPO_URL="$(git -C "$ROOT" remote get-url origin 2>/dev/null || true)"
fi
[[ -n "$REPO_URL" ]] || REPO_URL="https://github.com/mywebmasteruk/dua-prayer.git"

step "Source: $ROOT"
step "Workspace: $DEPLOY_DIR (branch $BRANCH)"

# --- Sync clean tree outside iCloud ---
if [[ -d "$DEPLOY_DIR/.git" ]]; then
  step "Updating existing clone"
  git -C "$DEPLOY_DIR" fetch origin "$BRANCH" --prune
  git -C "$DEPLOY_DIR" checkout "$BRANCH" 2>/dev/null || git -C "$DEPLOY_DIR" checkout -B "$BRANCH" "origin/$BRANCH"
  git -C "$DEPLOY_DIR" reset --hard "origin/$BRANCH"
  git -C "$DEPLOY_DIR" clean -fdx
else
  step "Cloning origin/$BRANCH"
  rm -rf "$DEPLOY_DIR"
  git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$DEPLOY_DIR"
fi

COMMIT="$(git -C "$DEPLOY_DIR" rev-parse --short HEAD)"
log "Deploying commit: $COMMIT"

cd "$DEPLOY_DIR"

if ! npx vercel whoami >/dev/null 2>&1; then
  die "Vercel CLI not authenticated — run 'npx vercel login'"
fi

# Team deploys hang in UNKNOWN when .git is present with a blocked git author.
step "Removing .git metadata (avoids team author-block UNKNOWN deploys)"
rm -rf .git

# Stray pnpm-lock.yaml makes Vercel pick pnpm over npm install in vercel build.
if [[ -f pnpm-lock.yaml ]]; then
  step "Removing pnpm-lock.yaml (project uses npm)"
  rm -f pnpm-lock.yaml
fi

# Clean install tree (git clean may leave partial node_modules on incremental runs).
rm -rf node_modules .next

# --- Vercel project link (gitignored; copy after .git removal so CLI won't relink) ---
if [[ ! -f "$ROOT/.vercel/project.json" ]]; then
  die "Missing $ROOT/.vercel/project.json — run 'npx vercel link' in the project first"
fi
step "Copying .vercel project link"
rm -rf .vercel
cp -R "$ROOT/.vercel" .vercel

VERCEL_ORG_ID="$(node -e "console.log(require('./.vercel/project.json').orgId)")"
VERCEL_PROJECT_ID="$(node -e "console.log(require('./.vercel/project.json').projectId)")"
export VERCEL_ORG_ID VERCEL_PROJECT_ID
log "Vercel project: $VERCEL_PROJECT_ID (org $VERCEL_ORG_ID)"

step "npm ci --legacy-peer-deps"
npm ci --legacy-peer-deps

step "vercel build --prod"
npx vercel build --prod --yes

step "vercel deploy --prebuilt --prod"
DEPLOY_OUT="$(mktemp)"
trap 'rm -f "$DEPLOY_OUT"' EXIT
if ! env VERCEL_ORG_ID="$VERCEL_ORG_ID" VERCEL_PROJECT_ID="$VERCEL_PROJECT_ID" \
  npx vercel deploy --prebuilt --prod --yes 2>&1 | tee "$DEPLOY_OUT"; then
  if grep -q '"readyState": "READY"' "$DEPLOY_OUT" || grep -q 'Aliased: https://dua-prayer.vercel.app' "$DEPLOY_OUT"; then
    log "vercel deploy exited non-zero but deployment is READY — continuing"
  else
    die "vercel deploy failed — see output above"
  fi
fi

DEPLOY_URL="$(grep -Eo 'https://[a-zA-Z0-9.-]+\.vercel\.app' "$DEPLOY_OUT" | tail -1 || true)"
ELAPSED="$(( $(date +%s) - STARTED_AT ))"
log "SUCCESS in ${ELAPSED}s"
[[ -n "$DEPLOY_URL" ]] && log "Production: $DEPLOY_URL"
log "Alias: https://dua-prayer.vercel.app"
exit 0
