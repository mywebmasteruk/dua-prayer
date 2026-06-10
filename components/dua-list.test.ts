import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

const source = readFileSync(new URL("./dua-list.tsx", import.meta.url), "utf8")

describe("dua list footer icons", () => {
  it("uses the logo-derived prayer hands icon for the Ameen action", () => {
    assert.match(source, /import \{ PrayerHandsIcon \} from "@\/components\/icons\/prayer-hands"/)
    assert.match(source, /<PrayerHandsIcon className="h-4 w-4" aria-hidden="true" \/>/)
    assert.doesNotMatch(source, /HeartHandshake/)
  })
})
