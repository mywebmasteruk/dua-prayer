import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

const source = readFileSync(new URL("./dua-bot-control-panel.tsx", import.meta.url), "utf8")

describe("DuaBotControlPanel refresh behavior", () => {
  it("uses App Router refresh instead of hard page reloads after bot operations", () => {
    assert.equal(source.includes("window.location.reload()"), false)
    assert.match(source, /router\.refresh\(\)/)
  })
})
