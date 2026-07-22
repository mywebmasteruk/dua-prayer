import { readFileSync, existsSync } from "fs"
import { resolve } from "path"
import pg from "pg"

const root = "/Users/asirokh/Library/Mobile Documents/com~apple~CloudDocs/OneDrive2/mywebmaster/startups/Non-profit/4.DuaPrayer/apps/dua-prayer"

// Load DATABASE_URL from .env.local
const envPath = resolve(root, ".env.local")
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim()
    if (!t || t.startsWith("#")) continue
    const i = t.indexOf("=")
    if (i === -1) continue
    const k = t.slice(0, i)
    let v = t.slice(i + 1)
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1)
    if (!process.env[k]) process.env[k] = v
  }
}

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL")
  process.exit(1)
}

const files = [
  "20260615120000_dua_bot_max_duas_per_run.sql",
  "20260615140000_widen_duas_text_for_curated.sql",
  "20260616120000_add_dua_language.sql",
  "20260616160000_dua_flags.sql",
  "20260616210000_add_suspended_account_status.sql",
]

const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })

try {
  await client.connect()
  console.log("Connected to", DATABASE_URL.replace(/:[^:@/]+@/, ":***@"))
  for (const name of files) {
    const sql = readFileSync(resolve(root, "supabase/migrations", name), "utf8")
    process.stdout.write(`Applying ${name} ... `)
    await client.query(sql)
    console.log("OK")
  }
  console.log("\nAll 5 migrations applied (idempotent).")
} catch (err) {
  console.error("\nFAILED:", err.message)
  process.exit(1)
} finally {
  await client.end()
}
