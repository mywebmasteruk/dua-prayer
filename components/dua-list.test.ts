import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

const source = readFileSync(new URL("./dua-list.tsx", import.meta.url), "utf8")

describe("dua list footer icons", () => {
  it("uses the DuaPrayer logo hands artwork for the Ameen action", () => {
    assert.match(source, /import Image from "next\/image"/)
    assert.match(source, /src="\/logo-icon\.png"/)
    assert.match(source, /alt=""/)
    assert.match(source, /className="h-4 w-4 object-contain"/)
    assert.doesNotMatch(source, /PrayerHandsIcon/)
    assert.doesNotMatch(source, /HeartHandshake/)
  })
})
