#!/usr/bin/env node
// One-off: replace "Make → Share" tagline/composer overrides saved in site_settings.
// Run after the code change so the DB stops shadowing the new defaults.

import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import pg from "pg"

const here = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(here, "..", ".env.local")
const envText = readFileSync(envPath, "utf8")
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "")
}

const url = process.env.DATABASE_URL
if (!url) throw new Error("DATABASE_URL missing from .env.local")

// key → fn(oldValue) returns the new value, or null to leave alone.
const rules = {
  "seo.title": (v) => (v && v.includes("Make Dua") ? v.replace(/Make Dua/g, "Share Dua") : null),
  "copy.composer.submit.en": (v) => (v && v.trim() === "Make" ? "Share" : null),
  "copy.composer.submit_aria.en": (v) => (v && v.trim() === "Make Dua" ? "Share Dua" : null),
  "copy.composer.submitting.en": (v) => (v && /^Making[.…]/.test(v.trim()) ? "Sharing…" : null),
  "copy.composer.placeholder.en": (v) =>
    v && v.startsWith("Make a dua") ? v.replace(/^Make a dua/, "Share a dua") : null,
  "seo.image": (v) => (v && /\/og-image\.png(\?v=\d+)?$/.test(v.trim()) ? "/og-image.png?v=3" : null),
}

const client = new pg.Client({ connectionString: url })
await client.connect()
try {
  const keys = Object.keys(rules)
  const { rows } = await client.query("select key, value from site_settings where key = any($1)", [keys])
  const byKey = new Map(rows.map((r) => [r.key, r.value]))

  for (const key of keys) {
    const current = byKey.get(key) ?? null
    const next = rules[key](current)
    if (next === null) {
      console.log(`skip   ${key} (current: ${JSON.stringify(current)})`)
      continue
    }
    await client.query(
      `insert into site_settings (key, value, updated_at)
       values ($1, $2, now())
       on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at`,
      [key, next],
    )
    console.log(`update ${key}: ${JSON.stringify(current)} -> ${JSON.stringify(next)}`)
  }
} finally {
  await client.end()
}
