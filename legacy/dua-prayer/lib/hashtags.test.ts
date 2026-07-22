import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { buildTrendingHashtags, extractHashtags, getTopHashtags, matchesHashtag, normalizeHashtag } from "./hashtags"

describe("hashtags", () => {
  it("extracts normalized unique hashtags from dua text", () => {
    assert.deepEqual(extractHashtags("Pray for #Earthquake, #earthquake and #Flood_Relief."), [
      { tag: "earthquake", label: "#earthquake" },
      { tag: "flood-relief", label: "#flood-relief" },
    ])
  })

  it("limits hashtag length and ignores non-hashtag fragments", () => {
    const longTag = "a".repeat(50)

    assert.deepEqual(extractHashtags(`Email a#notatag but pray for #${longTag}`), [
      { tag: "a".repeat(40), label: `#${"a".repeat(40)}` },
    ])
  })

  it("matches text against a normalized hashtag", () => {
    assert.equal(matchesHashtag("Please remember #Flood_Relief", "flood-relief"), true)
    assert.equal(matchesHashtag("Please remember #Flood_Relief", "earthquake"), false)
  })

  it("returns the first three normalized unique hashtags for card display", () => {
    assert.deepEqual(getTopHashtags("#One #Two #Three #Four #one"), [
      { tag: "one", label: "#one" },
      { tag: "two", label: "#two" },
      { tag: "three", label: "#three" },
    ])
  })

  it("builds trending hashtags by dua count, ameens, then tag", () => {
    const trending = buildTrendingHashtags([
      { text: "Pray for #flood", likes: 2 },
      { text: "Ameen for #earthquake #flood", likes: 8 },
      { text: "Remember #earthquake", likes: 1 },
    ])

    assert.deepEqual(trending, [
      { tag: "flood", label: "#flood", duas: 2, ameens: 10 },
      { tag: "earthquake", label: "#earthquake", duas: 2, ameens: 9 },
    ])
  })

  it("normalizes surrounding punctuation safely", () => {
    assert.equal(normalizeHashtag("earthquake!!!"), "earthquake")
  })
})
