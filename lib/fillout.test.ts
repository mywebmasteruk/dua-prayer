import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { buildFilloutEmbedUrl } from "./fillout"

describe("Fillout embed URLs", () => {
  it("prefills a signed-in user's email while preserving embed submit tracking", () => {
    const iframeSrc = buildFilloutEmbedUrl("abc123", "embed-123", { email: "user@example.com" })
    const url = new URL(iframeSrc)

    assert.equal(url.origin, "https://embed.fillout.com")
    assert.equal(url.pathname, "/t/abc123")
    assert.equal(url.searchParams.get("fillout-embed-id"), "embed-123")
    assert.equal(url.searchParams.get("email"), "user@example.com")
  })
})
