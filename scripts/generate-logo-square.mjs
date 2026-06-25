#!/usr/bin/env node
// Generate public/logo-512.png — a 512×512 square brand logo for schema.org
// Organization markup (Google rich results want a readable logo ≥112×112).
// Green praying-hands on a white rounded square, matching the brand.

import { writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import sharp from "sharp"

const here = dirname(fileURLToPath(import.meta.url))
const outPath = resolve(here, "..", "public", "logo-512.png")
const handsPath = resolve(here, "..", "public", "logo-icon.png")

const S = 512
const HANDS = 300 // target width of the hands artwork, centered

const bg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <rect width="${S}" height="${S}" rx="96" fill="#FFFFFF"/>
</svg>`

const hands = await sharp(handsPath)
  .resize(HANDS, HANDS, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toBuffer()
const { height: handsH } = await sharp(hands).metadata()

const buffer = await sharp(Buffer.from(bg))
  .composite([{ input: hands, top: Math.round((S - handsH) / 2), left: Math.round((S - HANDS) / 2) }])
  .png({ compressionLevel: 9 })
  .toBuffer()

writeFileSync(outPath, buffer)
console.log(`wrote ${outPath} (${buffer.length} bytes, ${S}x${S})`)
