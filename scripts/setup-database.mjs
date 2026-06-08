#!/usr/bin/env node
/**
 * Applies supabase/migrations/20250608000000_initial_schema.sql via direct Postgres.
 * Requires DATABASE_URL in .env.local (Supabase Dashboard → Settings → Database → URI).
 *
 * Usage: node scripts/setup-database.mjs
 */
import { readFileSync, existsSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import pg from "pg"

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

const DATABASE_URL = process.env.DATABASE_URL
const ADMIN_EMAIL = process.env.SETUP_ADMIN_EMAIL ?? "admin@duaprayer.app"

if (!DATABASE_URL) {
  console.error(
    "Missing DATABASE_URL. Add it to .env.local from Supabase → Settings → Database → Connection string (URI).",
  )
  process.exit(1)
}

const migrationPath = resolve(root, "supabase/migrations/20250608000000_initial_schema.sql")
const sql = readFileSync(migrationPath, "utf8")

const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })

try {
  await client.connect()
  console.log("Connected. Applying migration...")
  await client.query(sql)

  const adminSql = `
    INSERT INTO public.profiles (id, display_name, is_admin)
    SELECT id, COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1)), true
    FROM auth.users WHERE email = $1
    ON CONFLICT (id) DO UPDATE SET is_admin = true, updated_at = now();
  `
  const res = await client.query(adminSql, [ADMIN_EMAIL])
  console.log(`Admin promotion rows: ${res.rowCount}`)
  console.log("Database setup complete.")
} catch (err) {
  console.error("Setup failed:", err.message)
  process.exit(1)
} finally {
  await client.end()
}
