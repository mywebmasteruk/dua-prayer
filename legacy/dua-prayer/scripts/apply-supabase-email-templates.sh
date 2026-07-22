#!/usr/bin/env bash
# Apply DuaPrayer branded auth email templates via Supabase Management API.
# Requires: SUPABASE_ACCESS_TOKEN, PROJECT_REF (default: itcoxbkhcwlsjpcwawyl), jq, curl

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_REF="${PROJECT_REF:-itcoxbkhcwlsjpcwawyl}"

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Set SUPABASE_ACCESS_TOKEN from https://supabase.com/dashboard/account/tokens" >&2
  exit 1
fi

read_template() {
  local file="$1"
  python3 -c 'import json,sys; print(json.dumps(open(sys.argv[1]).read()))' "$file"
}

CONFIRMATION=$(read_template "$ROOT/supabase/templates/confirmation.html")
INVITE=$(read_template "$ROOT/supabase/templates/invite.html")
MAGIC_LINK=$(read_template "$ROOT/supabase/templates/magic_link.html")
RECOVERY=$(read_template "$ROOT/supabase/templates/recovery.html")
EMAIL_CHANGE=$(read_template "$ROOT/supabase/templates/email_change.html")
REAUTH=$(read_template "$ROOT/supabase/templates/reauthentication.html")

payload=$(cat <<EOF
{
  "mailer_subjects_confirmation": "Confirm your DuaPrayer account",
  "mailer_templates_confirmation_content": $CONFIRMATION,
  "mailer_subjects_invite": "You're invited to DuaPrayer",
  "mailer_templates_invite_content": $INVITE,
  "mailer_subjects_magic_link": "Your DuaPrayer sign-in link",
  "mailer_templates_magic_link_content": $MAGIC_LINK,
  "mailer_subjects_recovery": "Reset your DuaPrayer password",
  "mailer_templates_recovery_content": $RECOVERY,
  "mailer_subjects_email_change": "Confirm your new DuaPrayer email",
  "mailer_templates_email_change_content": $EMAIL_CHANGE,
  "mailer_subjects_reauthentication": "{{ .Token }} is your DuaPrayer verification code",
  "mailer_templates_reauthentication_content": $REAUTH
}
EOF
)

echo "Patching auth email templates for project $PROJECT_REF ..."
curl -fsS -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$payload" \
  | jq '{ updated: (keys | length) }'

echo "Done. Send a test signup to verify branding."
