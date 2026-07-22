#!/usr/bin/env node
// Regenerate public/og-image.png (1200×630) — green gradient + praying-hands logo + tagline.
// Composites the existing logo-icon.png so the hands artwork stays identical to the rest of the brand.

import { writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import sharp from "sharp"

const here = dirname(fileURLToPath(import.meta.url))
const outPath = resolve(here, "..", "public", "og-image.png")
const logoPath = resolve(here, "..", "public", "logo-icon.png")

const W = 1200
const H = 630
const TITLE = "DuaPrayer"
const TAGLINE = "Share Dua &amp; Pray For The Ummah"
const ICON_SIZE = 110
const ICON_CIRCLE_R = 92

const bgSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1E8A3F"/>
      <stop offset="1" stop-color="#136B30"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="${W / 2}" cy="220" r="${ICON_CIRCLE_R}" fill="#FFFFFF"/>
  <text x="${W / 2}" y="420"
        font-family="Inter, -apple-system, system-ui, sans-serif"
        font-size="108" font-weight="800" fill="#FFFFFF"
        text-anchor="middle" letter-spacing="-2">${TITLE}</text>
  <text x="${W / 2}" y="478"
        font-family="Inter, -apple-system, system-ui, sans-serif"
        font-size="34" font-weight="500" fill="rgba(255,255,255,0.92)"
        text-anchor="middle">${TAGLINE}</text>
</svg>`

const logo = await sharp(logoPath)
  .resize(ICON_SIZE, ICON_SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toBuffer()

const buffer = await sharp(Buffer.from(bgSvg))
  .composite([{ input: logo, top: Math.round(220 - ICON_SIZE / 2), left: Math.round(W / 2 - ICON_SIZE / 2) }])
  .png({ compressionLevel: 9 })
  .toBuffer()

writeFileSync(outPath, buffer)
console.log(`wrote ${outPath} (${buffer.length} bytes, 1200x630)`)
