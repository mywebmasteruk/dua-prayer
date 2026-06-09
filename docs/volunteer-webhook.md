# Volunteer registration webhook

> **Agent context:** Architecture, env vars, admin flow, and common mistakes are in [`AGENTS.md`](../AGENTS.md) (webhook runbook + DO NOT list). This doc is the Fillout/integration reference.

Volunteer applications from external forms (Fillout, Zapier, etc.) create a **pending** row in `profiles` linked to `auth.users`.

## Endpoint

```
POST /api/webhooks/volunteer
```

Base URL: `NEXT_PUBLIC_APP_URL` (e.g. `https://dua-prayer.vercel.app`).

**Important:** Fillout and other integrations must use **POST**, not GET. Opening the URL in a browser sends GET and only returns endpoint info — it does not submit an application.

### Health check (GET)

```
GET /api/webhooks/volunteer
```

Returns `200` with JSON describing the endpoint (for manual checks). Submissions still require **POST**.

## Authentication

Send the shared secret in a header:

```
X-Webhook-Secret: <VOLUNTEER_WEBHOOK_SECRET>
```

Requests without a matching secret receive `401 Unauthorized`.

## Request body

JSON object:

| Field | Required | Description |
|-------|----------|-------------|
| `email` | yes | Applicant email (creates or updates auth user) |
| `name` | no | Display name |
| `message` | no | Free-text note |
| `skills` | no | Skills or interests |
| `timezone` | no | Time zone |
| `availability` | no | Hours / availability |
| `source` | no | Origin label (default: `webhook`) |

Nested `application` object is also supported with the same fields.

### Example

```bash
curl -X POST "$NEXT_PUBLIC_APP_URL/api/webhooks/volunteer" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: $VOLUNTEER_WEBHOOK_SECRET" \
  -d '{
    "email": "sara@example.com",
    "name": "Sara Ahmed",
    "skills": "React, moderation",
    "timezone": "America/Chicago",
    "availability": "Weekends",
    "message": "Happy to help with content review."
  }'
```

### Success response (`200`)

```json
{
  "ok": true,
  "userId": "uuid",
  "status": "pending_review",
  "created": true
}
```

### Errors

| Status | Meaning |
|--------|---------|
| `400` | Missing or invalid `email` |
| `401` | Wrong or missing `X-Webhook-Secret` |
| `409` | Email already has an **active** account |
| `503` | `VOLUNTEER_WEBHOOK_SECRET` not configured |

## Outbound notification (optional)

If `VOLUNTEER_NOTIFY_WEBHOOK_URL` is set, the app POSTs a JSON payload when a new or updated pending application is stored:

```json
{
  "event": "volunteer.application.created",
  "timestamp": "2026-06-09T12:00:00.000Z",
  "userId": "uuid",
  "email": "sara@example.com",
  "name": "Sara Ahmed",
  "status": "pending_review",
  "created": true,
  "application": { "skills": "React", "source": "webhook" }
}
```

## Admin review

1. Sign in as an admin with **Volunteer applications** permission.
2. Open **Admin → Volunteers** (`/admin/volunteers`).
3. For each pending applicant: **Activate** (choose Volunteer / Moderator / Admin) or **Reject**.

Activated users can sign in. Pending and rejected users are blocked at login with a clear message.

## Fillout

In Fillout → Integrations → Webhook:

1. **URL:** `https://dua-prayer.vercel.app/api/webhooks/volunteer` (or your `NEXT_PUBLIC_APP_URL` + path)
2. **Method:** **POST** (required — GET will not create applications)
3. **Content-Type:** `application/json` (Fillout default)
4. **Custom header:** `X-Webhook-Secret` = your `VOLUNTEER_WEBHOOK_SECRET` value
5. **Body:** Leave Fillout’s **default webhook payload** enabled (recommended). The server reads `submission.questions[]` and maps question names automatically:
   - `Email` → email
   - `Name` → name
   - `Area of Support` → skills
   - `Message`, `Timezone`, `Availability` → same fields

Optional custom JSON body mapping still works if you prefer explicit keys (`email`, `name`, `skills`, etc.).

If Fillout shows HTTP 405, verify the integration is set to **POST**, not GET.

## Fillout setup (avoid 401)

Production URL (current deployment):

```
https://dua-prayer.vercel.app/api/webhooks/volunteer
```

The server **only** accepts the secret in this header (name is case-insensitive; value must match exactly):

| Field | Value |
|-------|--------|
| Header name | `X-Webhook-Secret` |
| Header value | Your `VOLUNTEER_WEBHOOK_SECRET` from Vercel **Production** (64-char hex, no quotes, no spaces) |

### Step-by-step in Fillout

1. Open your form → **Integrations** → **Webhooks** (or **Send to Webhook**).
2. **Webhook URL**: `https://dua-prayer.vercel.app/api/webhooks/volunteer`
3. **Method**: `POST`
4. **Content type**: `application/json` (JSON body).
5. **Custom headers** (required — do not use “Authorization” unless you add code support):
   - Add one row: **Name** = `X-Webhook-Secret`, **Value** = paste the secret once (no trailing newline).
6. **Body**: Map Fillout fields to JSON keys. At minimum include `email`. Example mapping:

```json
{
  "email": "{{Email}}",
  "name": "{{Name}}",
  "message": "{{Message}}",
  "skills": "{{Skills}}",
  "timezone": "{{Timezone}}",
  "availability": "{{Availability}}",
  "source": "fillout"
}
```

Use your form’s exact merge tags for each field.

### What does **not** work (returns 401)

- Header named `Webhook-Secret` without the `X-` prefix
- `Authorization: Bearer <secret>`
- Secret in the query string (`?secret=...`)
- Preview/staging secret while hitting production URL (or the reverse)
- Typo in header name (`X-Webhook-Secret` vs `X-Webhook-Secrets`)

### Verify with curl (production)

Replace `YOUR_SECRET` with the same value as in Vercel Production → Settings → Environment Variables → `VOLUNTEER_WEBHOOK_SECRET`:

```bash
curl -sS -X POST "https://dua-prayer.vercel.app/api/webhooks/volunteer" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: YOUR_SECRET" \
  -d '{"email":"you@example.com","name":"Test","source":"fillout"}'
```

- `401` + `{"error":"Unauthorized"}` → header missing, wrong name, or secret mismatch in Fillout.
- `400` + `email is required` → auth OK; fix JSON/body mapping.
- `200` + `"ok":true` → success.
- `500` with Supabase schema message → auth OK; fix database migration (separate from 401).

As of verification, Vercel Production `VOLUNTEER_WEBHOOK_SECRET` matches the 64-character hex secret configured in the prior session; curl with `X-Webhook-Secret` does **not** return 401.
