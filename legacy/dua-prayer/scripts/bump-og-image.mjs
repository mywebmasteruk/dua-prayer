#!/usr/bin/env node
// One-off: bump seo.image so scrapers re-fetch the OG card.
// Reads DATABASE_URL from .env.local. Triggers prod revalidation via REVALIDATE_TOKEN if set.

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

const targetValue = process.argv[2] ?? "/og-image.png?v=2"
const url = process.env.DATABASE_URL
if (!url) throw new Error("DATABASE_URL missing from .env.local")

const client = new pg.Client({ connectionString: url })
await client.connect()
try {
  const { rows: before } = await client.query("select value from site_settings where key = 'seo.image'")
  console.log("seo.image before:", before[0]?.value ?? "<none>")

  await client.query(
    `insert into site_settings (key, value, updated_at)
     values ('seo.image', $1, now())
     on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at`,
    [targetValue],
  )

  const { rows: after } = await client.query("select value from site_settings where key = 'seo.image'")
  console.log("seo.image after: ", after[0]?.value)
} finally {
  await client.end()
}
