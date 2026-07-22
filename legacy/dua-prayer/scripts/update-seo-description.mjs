#!/usr/bin/env node
// One-off: update seo.description so LinkedIn's "≥100 chars" warning clears.

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

const next =
  "A nonprofit community platform to share dua and pray for the Muslim Ummah. A community prayer digital wall."
console.log("length:", next.length)

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()
try {
  const { rows: before } = await client.query("select value from site_settings where key = 'seo.description'")
  console.log("before:", before[0]?.value ?? "<none>")

  await client.query(
    `insert into site_settings (key, value, updated_at)
     values ('seo.description', $1, now())
     on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at`,
    [next],
  )

  const { rows: after } = await client.query("select value from site_settings where key = 'seo.description'")
  console.log("after: ", after[0]?.value)
} finally {
  await client.end()
}
