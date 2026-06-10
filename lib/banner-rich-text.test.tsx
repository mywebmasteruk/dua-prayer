import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { isSafeBannerHref, parseBannerRichText, sanitizeBannerColor } from "./banner-rich-text"

describe("beta banner rich text", () => {
  it("parses safe markdown-style links", () => {
    assert.deepEqual(parseBannerRichText("Beta mode: [learn more](/about)."), [
      { type: "text", text: "Beta mode: " },
      { type: "link", text: "learn more", href: "/about" },
      { type: "text", text: "." },
    ])
  })

  it("keeps unsafe links as plain text", () => {
    assert.equal(isSafeBannerHref("javascript:alert(1)"), false)
    assert.deepEqual(parseBannerRichText("Click [bad](javascript:alert(1))"), [
      { type: "text", text: "Click [bad](javascript:alert(1))" },
    ])
  })

  it("accepts only hex colors", () => {
    assert.equal(sanitizeBannerColor("#fff"), "#fff")
    assert.equal(sanitizeBannerColor("#fef3c7"), "#fef3c7")
    assert.equal(sanitizeBannerColor("url(javascript:bad)"), "#fef3c7")
  })
})
