# DuaPrayer Supabase Auth email templates

Branded HTML templates for Supabase Authentication emails. Uses the app green primary (`hsl(142 71% 36%)` → `#1a9f47`) and the production logo.

## Logo URL

```
https://dua-prayer.vercel.app/logo-wide.png
```

Verified publicly accessible (HTTP 200). Also available locally at `public/logo-wide.png`.

## Template files

| Supabase template | File | Subject line |
| --- | --- | --- |
| Confirm signup | `supabase/templates/confirmation.html` | Confirm your DuaPrayer account |
| Invite user | `supabase/templates/invite.html` | You're invited to DuaPrayer |
| Magic link | `supabase/templates/magic_link.html` | Your DuaPrayer sign-in link |
| Reset password | `supabase/templates/recovery.html` | Reset your DuaPrayer password |
| Change email | `supabase/templates/email_change.html` | Confirm your new DuaPrayer email |
| Reauthentication | `supabase/templates/reauthentication.html` | `{{ .Token }} is your DuaPrayer verification code` |

## Apply to hosted Supabase (required)

The Supabase MCP server does **not** expose an email-template update tool. Apply templates manually:

1. Open [Supabase Dashboard → Authentication → Email Templates](https://supabase.com/dashboard/project/itcoxbkhcwlsjpcwawyl/auth/templates) for project `itcoxbkhcwlsjpcwawyl`.
2. For each template type above:
   - Set the **Subject** from the table.
   - Paste the full HTML from the matching file in `supabase/templates/`.
   - Save.
3. Confirm **Authentication → URL Configuration**:
   - **Site URL:** `https://dua-prayer.vercel.app`
   - **Redirect URLs** include `https://dua-prayer.vercel.app/auth/callback`

### Optional: Management API (one-shot)

If you have a [personal access token](https://supabase.com/dashboard/account/tokens):

```bash
export SUPABASE_ACCESS_TOKEN="your-token"
export PROJECT_REF="itcoxbkhcwlsjpcwawyl"
cd apps/dua-prayer
./scripts/apply-supabase-email-templates.sh
```

## Local Supabase CLI

When you add or extend `supabase/config.toml`, merge the blocks from `supabase/email-templates.config.toml`, then restart:

```bash
supabase stop && supabase start
```

## Free tier notes

| Feature | Free tier |
| --- | --- |
| Custom HTML email templates | Yes — edit in Dashboard |
| Custom subjects | Yes |
| Custom SMTP | No — uses Supabase default mailer on free tier |
| Remove Supabase sender domain | No — emails still send from Supabase infrastructure |
| Security notification emails | Yes — optional branded templates (not included here; enable per notification in Dashboard) |

**Unavoidable on free tier:** Supabase may still deliver from their mail infrastructure (e.g. `noreply@mail.app.supabase.io`). The message body is fully branded; you cannot use a custom `From` address without custom SMTP (Pro plan add-on or external SMTP).

**Email prefetching:** Some corporate mail scanners consume one-click links. If users report "token expired" on first click, consider OTP flow (`{{ .Token }}`) or a confirm button pattern — see [Supabase email template docs](https://supabase.com/docs/guides/auth/auth-email-templates#email-prefetching).

## Brand reference

- Primary green: `#1a9f47` (`--primary: 142 71% 36%` in `app/globals.css`)
- Site: `https://dua-prayer.vercel.app`
- Tone: neutral community prayer-sharing platform (not religious advisor)
