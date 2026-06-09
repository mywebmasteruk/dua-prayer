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
  git -C "$DEPLOY_DIR" clean -fdx -e node_modules -e .next -e .vercel
else
  step "Cloning origin/$BRANCH"
  rm -rf "$DEPLOY_DIR"
  git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$DEPLOY_DIR"
fi

COMMIT="$(git -C "$DEPLOY_DIR" rev-parse --short HEAD)"
log "Deploying commit: $COMMIT"

# --- Vercel project link (gitignored; copy from linked local project) ---
if [[ ! -d "$ROOT/.vercel" ]]; then
  die "Missing $ROOT/.vercel — run 'npx vercel link' in the project first"
fi
step "Copying .vercel project link"
rm -rf "$DEPLOY_DIR/.vercel"
cp -R "$ROOT/.vercel" "$DEPLOY_DIR/.vercel"

cd "$DEPLOY_DIR"

if ! npx vercel whoami >/dev/null 2>&1; then
  die "Vercel CLI not authenticated — run 'npx vercel login'"
fi

step "npm ci --legacy-peer-deps"
npm ci --legacy-peer-deps

step "vercel build --prod"
npx vercel build --prod --yes

step "vercel deploy --prebuilt --prod"
DEPLOY_OUT="$(mktemp)"
trap 'rm -f "$DEPLOY_OUT"' EXIT
if ! npx vercel deploy --prebuilt --prod --yes 2>&1 | tee "$DEPLOY_OUT"; then
  die "vercel deploy failed — see output above"
fi

DEPLOY_URL="$(grep -Eo 'https://[a-zA-Z0-9.-]+\.vercel\.app' "$DEPLOY_OUT" | tail -1 || true)"
ELAPSED="$(( $(date +%s) - STARTED_AT ))"
log "SUCCESS in ${ELAPSED}s"
[[ -n "$DEPLOY_URL" ]] && log "Production: $DEPLOY_URL"
log "Alias: https://dua-prayer.vercel.app"
exit 0
