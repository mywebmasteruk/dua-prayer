import nodemailer from "nodemailer"
import type { Transporter } from "nodemailer"

let cached: Transporter | null = null

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}

function getTransporter(): Transporter | null {
  if (cached) return cached
  if (!isEmailConfigured()) return null
  cached = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    // SMTP_SECURE=false selects STARTTLS (port 587); default is implicit TLS (465).
    secure: process.env.SMTP_SECURE !== "false",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
  return cached
}

/** Sends an email. Best-effort: returns false on misconfig or failure, never throws. */
export async function sendEmail(input: {
  to: string
  subject: string
  html: string
  text?: string
}): Promise<boolean> {
  const transporter = getTransporter()
  if (!transporter) return false
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    })
    return true
  } catch (err) {
    console.error("Email send failed:", err)
    return false
  }
}

/** Verifies SMTP credentials/connection without sending. */
export async function verifyEmailTransport(): Promise<{ ok: boolean; error?: string }> {
  const transporter = getTransporter()
  if (!transporter) return { ok: false, error: "SMTP not configured" }
  try {
    await transporter.verify()
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://duaprayer.com").replace(/\/$/, "")
}

/** Builds a simple branded transactional email from a notification's fields. */
export function buildNotificationEmail(input: {
  title: string
  body?: string | null
  href?: string | null
}): { subject: string; html: string; text: string } {
  const base = appBaseUrl()
  const url = input.href ? (input.href.startsWith("http") ? input.href : `${base}${input.href}`) : base
  const body = input.body ?? ""

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr><td style="padding:24px 28px 8px;">
            <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#16a34a;">DuaPrayer</p>
          </td></tr>
          <tr><td style="padding:4px 28px 0;">
            <h1 style="margin:0;font-size:20px;line-height:1.3;color:#0f172a;">${escapeHtml(input.title)}</h1>
          </td></tr>
          ${body ? `<tr><td style="padding:12px 28px 0;"><p style="margin:0;font-size:15px;line-height:1.6;color:#475569;">${escapeHtml(body)}</p></td></tr>` : ""}
          <tr><td style="padding:24px 28px 28px;">
            <a href="${url}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:11px 20px;border-radius:9999px;">Open DuaPrayer</a>
          </td></tr>
          <tr><td style="padding:0 28px 24px;">
            <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">You're receiving this because of activity on your DuaPrayer account.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`

  const text = `${input.title}\n\n${body ? body + "\n\n" : ""}${url}`
  return { subject: input.title, html, text }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
