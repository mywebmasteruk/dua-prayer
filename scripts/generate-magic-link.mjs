#!/usr/bin/env node
/**
 * Generate a one-time magic link for the super admin (or any email).
 *
 * Usage:
 *   npm run auth:magic-link
 *   node scripts/generate-magic-link.mjs webmaster@duaprayer.com
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SECRET_KEY
 *   NEXT_PUBLIC_APP_URL (optional, defaults to http://localhost:3000)
 *   SUPER_ADMIN_EMAIL or PLATFORM_FOUNDER_EMAIL (default target email)
 */
import { readFileSync, existsSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, "..")

function loadEnvLocal() {
  const path = resolve(root, ".env.local")
  if (!existsSync(path)) return
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim()
    if (!t || t.startsWith("#")) continue
    const i = t.indexOf("=")
    if (i === -1) continue
    const key = t.slice(0, i)
    const val = t.slice(i + 1)
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnvLocal()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")
const secret = process.env.SUPABASE_SECRET_KEY
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
const defaultEmail =
  process.env.SUPER_ADMIN_EMAIL ??
  process.env.PLATFORM_FOUNDER_EMAIL ??
  process.env.SETUP_ADMIN_EMAIL ??
  "webmaster@duaprayer.com"
const email = (process.argv[2] ?? defaultEmail).trim().toLowerCase()
const redirectTo = `${appUrl.replace(/\/$/, "")}/auth/callback?next=/admin`

if (!url || !secret) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local")
  process.exit(1)
}

const response = await fetch(`${url}/auth/v1/admin/generate_link`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${secret}`,
    apikey: secret,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    type: "magiclink",
    email,
    options: { redirect_to: redirectTo },
  }),
})

const payload = await response.json().catch(() => ({}))

if (!response.ok) {
  console.error("Failed to generate magic link:", payload?.msg ?? payload?.message ?? response.statusText)
  process.exit(1)
}

const link = payload?.action_link ?? payload?.properties?.action_link
if (!link) {
  console.error("No action_link returned from Supabase:", JSON.stringify(payload, null, 2))
  process.exit(1)
}

console.log("")
console.log("Magic link generated for:", email)
console.log("Redirect after sign-in:", redirectTo)
console.log("")
console.log(link)
console.log("")
console.log("Open this URL in a browser to sign in. The link is single-use and expires quickly.")
console.log("Alternatively: visit", `${appUrl}/auth`, "and use the Magic link tab with this email.")
