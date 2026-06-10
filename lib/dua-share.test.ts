import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { buildDuaSharePayload, buildDuaShareUrl, DUA_SHARE_URL, type DuaSharePlatform } from "./dua-share"

const separateUrlPlatforms = ["telegram", "twitter", "facebook"] as const satisfies readonly DuaSharePlatform[]
const allPlatforms = ["whatsapp", ...separateUrlPlatforms] as const satisfies readonly DuaSharePlatform[]

function countCanonicalUrls(value: string) {
  return value.split(DUA_SHARE_URL).length - 1
}

describe("dua sharing", () => {
  it("formats a canonical share payload with dua text and a separate website URL", () => {
    const payload = buildDuaSharePayload({ id: 42, text: "May Allah grant healing and ease." })

    assert.equal(payload.title, "DuaPrayer")
    assert.equal(payload.url, DUA_SHARE_URL)
    assert.equal(payload.text, "May Allah grant healing and ease.\n\nShared from DuaPrayer")
  })

  it("keeps long duas concise while preserving the separate canonical website address", () => {
    const payload = buildDuaSharePayload({ id: 7, text: `${"Ameen ".repeat(80)}final words` })

    assert.equal(payload.url, DUA_SHARE_URL)
    assert.equal(countCanonicalUrls(payload.text), 0)
    assert.ok(payload.text.length <= 320)
    assert.ok(payload.text.includes("…"))
  })

  it("builds platform share URLs with the dua text and exactly one canonical URL", () => {
    const dua = { id: 9, text: "Please make dua for my family." }

    for (const platform of allPlatforms) {
      const decodedShareUrl = decodeURIComponent(buildDuaShareUrl(platform, dua))

      assert.equal(countCanonicalUrls(decodedShareUrl), 1, platform)
      assert.ok(decodedShareUrl.includes(dua.text), platform)
    }
  })

  it("keeps the URL out of text fields when platforms accept a separate URL parameter", () => {
    const dua = { id: 9, text: "Please make dua for my family." }

    for (const platform of separateUrlPlatforms) {
      const shareUrl = new URL(buildDuaShareUrl(platform, dua))
      const textParam = platform === "facebook" ? shareUrl.searchParams.get("quote") : shareUrl.searchParams.get("text")
      const urlParam = platform === "facebook" ? shareUrl.searchParams.get("u") : shareUrl.searchParams.get("url")

      assert.equal(textParam?.includes(DUA_SHARE_URL), false, platform)
      assert.equal(urlParam, DUA_SHARE_URL, platform)
      assert.ok(textParam?.includes(dua.text), platform)
    }
  })

  it("includes the canonical URL once in WhatsApp's text-only share parameter", () => {
    const dua = { id: 9, text: "Please make dua for my family." }
    const shareUrl = new URL(buildDuaShareUrl("whatsapp", dua))
    const textParam = shareUrl.searchParams.get("text") ?? ""

    assert.equal(countCanonicalUrls(textParam), 1)
    assert.ok(textParam.includes(dua.text))
  })
})
