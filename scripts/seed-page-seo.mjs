#!/usr/bin/env node
// One-time seed: move the previously-hardcoded per-page title/description into
// site_settings so they're preserved and admin-editable. Uses INSERT ... ON
// CONFLICT DO NOTHING so re-running never clobbers later admin edits. Image is
// left unset on purpose (pages fall back to the global SEO share image).

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

const SEED = {
  about: {
    title: "About — DuaPrayer",
    description:
      "Learn about DuaPrayer — a nonprofit community platform for sharing duas and responding with ameen.",
  },
  channels: {
    title: "Channels — DuaPrayer",
    description: "Browse community channels and follow the duas that matter most to you.",
  },
  "channels-apply": {
    title: "Apply for a channel — DuaPrayer",
    description: "Apply to open a community channel on DuaPrayer for imams, masjids, and community teams.",
  },
  donate: {
    title: "Donate — DuaPrayer",
    description: "Support DuaPrayer and help keep the community prayer platform free and welcoming.",
  },
  resources: {
    title: "Resources — DuaPrayer",
    description:
      "Community guidelines, tips for sharing duas, and quick answers for getting the most from DuaPrayer.",
  },
  safety: {
    title: "Safety — DuaPrayer",
    description: "Trust, safety, and privacy practices for sharing duas on DuaPrayer.",
  },
  volunteer: {
    title: "Volunteer — DuaPrayer",
    description:
      "Help keep DuaPrayer welcoming and available — moderation, engineering, design, and platform care for the community.",
  },
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()
try {
  for (const [slug, { title, description }] of Object.entries(SEED)) {
    for (const [field, value] of [
      ["title", title],
      ["description", description],
    ]) {
      const key = `seo.page.${slug}.${field}`
      const res = await client.query(
        `insert into site_settings (key, value, updated_at)
         values ($1, $2, now())
         on conflict (key) do nothing`,
        [key, value],
      )
      console.log(`${res.rowCount ? "seed " : "skip "} ${key}`)
    }
  }
} finally {
  await client.end()
}
