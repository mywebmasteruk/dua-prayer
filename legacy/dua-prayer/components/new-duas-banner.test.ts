import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { formatNewDuasBannerLabel } from "./new-duas-banner"

describe("new duas banner", () => {
  it("never interpolates a missing category label", () => {
    assert.equal(formatNewDuasBannerLabel(1), "Show 1 new dua")
    assert.equal(formatNewDuasBannerLabel(3), "Show 3 new duas")
    assert.equal(formatNewDuasBannerLabel(undefined), "Show new duas")
  })
})
