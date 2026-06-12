import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

const source = readFileSync(new URL("./feed-filters.tsx", import.meta.url), "utf8")

describe("feed filters", () => {
  it("renders trending hashtag chips with post counts instead of category chips", () => {
    assert.match(source, /trendingHashtags: TrendingHashtag\[\]/)
    assert.match(source, /const hashtagPills = \[\{ tag: "", label: "All" \}, \.\.\.trendingHashtags\]/)
    assert.match(source, /count=\{"duas" in pill \? pill\.duas : undefined\}/)
    assert.match(source, /aria-label="Filter duas by trending hashtag"/)
    assert.doesNotMatch(source, /getChannelHandle/)
    assert.doesNotMatch(source, /onCategoryChange/)
  })
})
