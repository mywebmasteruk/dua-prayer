#!/usr/bin/env bash
# Apply Makerkit + DuaPrayer community migrations to a linked Supabase project.
#
# Prerequisites:
#   - supabase CLI logged in (`pnpm --filter web supabase login`)
#   - SUPABASE_PROJECT_REF set (production: itcoxbkhcwlsjpcwawyl)
#
# Usage:
#   SUPABASE_PROJECT_REF=itcoxbkhcwlsjpcwawyl ./scripts/cutover-db.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REF="${SUPABASE_PROJECT_REF:-}"

if [[ -z "$REF" ]]; then
  echo "Set SUPABASE_PROJECT_REF (e.g. itcoxbkhcwlsjpcwawyl)" >&2
  exit 1
fi

cd "$ROOT/apps/web"

echo "==> Linking Supabase project $REF"
pnpm exec supabase link --project-ref "$REF"

echo "==> Pushing migrations (Makerkit base + 20260722* community)"
pnpm exec supabase db push

echo "==> Done. Verify tables/policies in the Supabase dashboard, then redeploy Vercel."
