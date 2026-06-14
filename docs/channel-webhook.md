# Channel registration webhook

Channel applications from Fillout create a **pending** row in `categories` (`channel_type: user`, `status: pending_review`). Admins approve or reject in **Admin → Channels → Applications**.

## Endpoint

```
POST /api/webhooks/channel
```

Base URL: `NEXT_PUBLIC_APP_URL` (e.g. `https://dua-prayer.vercel.app`).

**Important:** Fillout must use **POST**, not GET. Opening the URL in a browser sends GET and only returns endpoint info.

### Health check (GET)

```
GET /api/webhooks/channel
```

Returns `200` with JSON describing the endpoint. Submissions still require **POST**.

## Authentication

```
X-Webhook-Secret: <CHANNEL_WEBHOOK_SECRET>
```

Requests without a matching secret receive `401 Unauthorized`.

## Request body

JSON object (or Fillout default payload with `submission.questions[]`):

| Field | Required | Description |
|-------|----------|-------------|
| `email` | yes | Applicant email |
| `channel name` | yes | Proposed channel name |
| `description` | no | Channel description (defaults to channel name) |
| `handle` | no | Short handle / slug (auto-generated from name if omitted) |
| `name` | no | Applicant contact name |
| `message` | no | Extra notes |
| `organization` | no | Organization / masjid name |
| `website` | no | Website URL |
| `type` | no | Channel type |
| `socialmedialink` | no | Social media profile link |
| `location` | no | Country / location |
| `langs` | no | Primary posting language(s) |
| `orgNo` | no | Legal entity / registration number |
| `role` | no | Applicant's role (e.g. "Imam") |
| `agreeTC` | no | Terms & conditions agreement (stored as boolean) |
| `source` | no | Origin label (default: `fillout`) |

Fillout question name mapping (case-insensitive):

- `Email` → applicant email
- `Channel name` / `Organization` → channel name
- `Description` → description
- `Handle` → handle
- `Name` → applicant name

### Example

```bash
curl -X POST "$NEXT_PUBLIC_APP_URL/api/webhooks/channel" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: $CHANNEL_WEBHOOK_SECRET" \
  -d '{
    "email": "imam@masjid.org",
    "channel name": "Masjid Al-Noor",
    "description": "Community duas for our local masjid.",
    "name": "Imam Yusuf",
    "handle": "al-noor"
  }'
```

### Success response (`200`)

```json
{
  "ok": true,
  "channelId": 42,
  "applicationId": 42,
  "status": "pending_review",
  "created": true
}
```

Duplicate Fillout submission IDs return `200` with `"created": false` (idempotent).

### Errors

| Status | Meaning |
|--------|---------|
| `400` | Missing email or channel name, invalid JSON |
| `401` | Wrong or missing `X-Webhook-Secret` |
| `409` | Channel name or handle already taken |
| `503` | `CHANNEL_WEBHOOK_SECRET` not configured |

## Outbound notification (optional)

If `CHANNEL_NOTIFY_WEBHOOK_URL` is set, the app POSTs when a **new** pending application is stored:

```json
{
  "event": "channel.application.created",
  "timestamp": "2026-06-09T12:00:00.000Z",
  "channelId": 42,
  "channelName": "Masjid Al-Noor",
  "applicantEmail": "imam@masjid.org",
  "status": "pending_review",
  "created": true
}
```

## Admin review

1. Sign in as an admin with **Channels** permission.
2. Open **Admin → Channels** → **Applications** tab.
3. **Approve** — channel goes live with verified badge (`channel_type: user`, `status: approved`, `is_verified: true`).
4. **Reject** — stays hidden from `/channels`.

If the applicant email matches an existing DuaPrayer account, `owner_id` is linked automatically.

## Database

Migration `20250609150000_channel_applications.sql` extends `categories` with:

- `channel_type` (`category` | `user`)
- `status` (`approved` | `pending_review` | `rejected`)
- `owner_id`, `handle`, `is_verified`, `verified_at`, `reviewed_at`, `reviewed_by`
- `application` (jsonb — email, Fillout submission id, extra fields)

RLS hides non-approved channels from public selects; admins manage via service role.

## Fillout setup

1. **URL:** `https://dua-prayer.vercel.app/api/webhooks/channel`
2. **Method:** **POST**
3. **Content-Type:** `application/json`
4. **Custom header:** `X-Webhook-Secret` = your `CHANNEL_WEBHOOK_SECRET`
5. **Body:** Default Fillout payload (recommended) or explicit JSON mapping

### Local development

```
http://localhost:3000/api/webhooks/channel
```

Set `CHANNEL_WEBHOOK_SECRET` in `.env.local`.

### Verify with curl

```bash
curl -sS -X POST "http://localhost:3000/api/webhooks/channel" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: YOUR_SECRET" \
  -d '{"email":"you@example.com","channel name":"Test Channel","description":"Demo"}'
```

- `401` → header missing or secret mismatch
- `400` → auth OK; fix body mapping
- `200` + `"ok":true` → success; check Admin → Channels → Applications
