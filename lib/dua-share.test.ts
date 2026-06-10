import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { buildDuaSharePayload, buildDuaShareUrl, DUA_SHARE_URL } from "./dua-share"

describe("dua sharing", () => {
  it("formats a canonical share payload with the dua text and duaprayer.com URL", () => {
    const payload = buildDuaSharePayload({ id: 42, text: "May Allah grant healing and ease." })

    assert.equal(payload.title, "DuaPrayer")
    assert.equal(payload.url, DUA_SHARE_URL)
    assert.equal(payload.text, "May Allah grant healing and ease.\n\nShared from DuaPrayer: https://duaprayer.com")
  })

  it("keeps long duas concise while preserving the canonical website address", () => {
    const payload = buildDuaSharePayload({ id: 7, text: `${"Ameen ".repeat(80)}final words` })

    assert.equal(payload.url, DUA_SHARE_URL)
    assert.ok(payload.text.includes("https://duaprayer.com"))
    assert.ok(payload.text.length <= 320)
    assert.ok(payload.text.includes("…"))
  })

  it("builds platform share URLs from the same canonical payload", () => {
    const dua = { id: 9, text: "Please make dua for my family." }

    assert.equal(
      buildDuaShareUrl("whatsapp", dua),
      "https://wa.me/?text=Please%20make%20dua%20for%20my%20family.%0A%0AShared%20from%20DuaPrayer%3A%20https%3A%2F%2Fduaprayer.com",
    )
    assert.equal(
      buildDuaShareUrl("telegram", dua),
      "https://t.me/share/url?url=https%3A%2F%2Fduaprayer.com&text=Please%20make%20dua%20for%20my%20family.%0A%0AShared%20from%20DuaPrayer%3A%20https%3A%2F%2Fduaprayer.com",
    )
    assert.equal(
      buildDuaShareUrl("twitter", dua),
      "https://twitter.com/intent/tweet?text=Please%20make%20dua%20for%20my%20family.%0A%0AShared%20from%20DuaPrayer%3A%20https%3A%2F%2Fduaprayer.com&url=https%3A%2F%2Fduaprayer.com",
    )
    assert.equal(
      buildDuaShareUrl("facebook", dua),
      "https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fduaprayer.com&quote=Please%20make%20dua%20for%20my%20family.%0A%0AShared%20from%20DuaPrayer%3A%20https%3A%2F%2Fduaprayer.com",
    )
  })
})
