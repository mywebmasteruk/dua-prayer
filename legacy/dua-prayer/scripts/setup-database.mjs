#!/usr/bin/env node
/**
 * Applies supabase/migrations/20250608000000_initial_schema.sql via direct Postgres.
 * Requires DATABASE_URL in .env.local (Supabase Dashboard → Settings → Database → URI).
 *
 * Usage: node scripts/setup-database.mjs
 */
import { readFileSync, existsSync, readdirSync } from "fs"
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
const FOUNDER_EMAIL =
  process.env.SUPER_ADMIN_EMAIL ??
  process.env.PLATFORM_FOUNDER_EMAIL ??
  process.env.SETUP_ADMIN_EMAIL ??
  "webmaster@duaprayer.com"

if (!DATABASE_URL) {
  console.error(
    "Missing DATABASE_URL. Add it to .env.local from Supabase → Settings → Database → Connection string (URI).",
  )
  process.exit(1)
}

const migrationsDir = resolve(root, "supabase/migrations")
const migrationFiles = readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort()

if (migrationFiles.length === 0) {
  console.error("No migration files found in supabase/migrations")
  process.exit(1)
}

const sql = migrationFiles
  .map((name) => readFileSync(resolve(migrationsDir, name), "utf8"))
  .join("\n\n")

const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })

try {
  await client.connect()
  console.log(`Connected. Applying ${migrationFiles.length} migration(s)...`)
  await client.query(sql)

  const adminSql = `
    INSERT INTO public.profiles (id, display_name, is_admin, admin_role, admin_permissions)
    SELECT id, COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1)), true, 'admin', '{}'::jsonb
    FROM auth.users WHERE lower(email) = lower($1)
    ON CONFLICT (id) DO UPDATE SET
      is_admin = true,
      admin_role = 'admin',
      admin_permissions = '{}'::jsonb,
      updated_at = now();
  `
  const res = await client.query(adminSql, [FOUNDER_EMAIL])
  console.log(`Founding admin promotion (${FOUNDER_EMAIL}) rows: ${res.rowCount}`)
  console.log("Database setup complete.")
} catch (err) {
  console.error("Setup failed:", err.message)
  process.exit(1)
} finally {
  await client.end()
}
