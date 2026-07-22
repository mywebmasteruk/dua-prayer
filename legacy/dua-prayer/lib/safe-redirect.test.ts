import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { safeNextPath } from "./safe-redirect"

describe("safeNextPath", () => {
  it("removes auth-loop query params from same-origin redirects", () => {
    assert.equal(safeNextPath("/?signin=1&error=still-here"), "/")
    assert.equal(safeNextPath("/channels?code=abc&category=family"), "/channels?category=family")
  })

  it("rejects cross-origin redirects", () => {
    assert.equal(safeNextPath("https://evil.example/admin"), "/")
    assert.equal(safeNextPath("//evil.example/admin"), "/")
  })
})
