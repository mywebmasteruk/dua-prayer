import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { selectUnpostedDuaBotEvents } from "./dua-bots"

type TestEvent = Parameters<typeof selectUnpostedDuaBotEvents>[0][number]

function event(key: string, publishedAt: string): TestEvent {
  return {
    key,
    title: `Event ${key}`,
    summary: "Families need urgent flood relief.",
    url: `https://example.com/${key}`,
    publishedAt,
    sourceType: "rss",
    sourceUrl: "https://example.com/feed.xml",
  }
}

describe("dua bot event selection", () => {
  it("skips already-posted top matches and selects later unposted matches", () => {
    const candidates = [
      event("duplicate-newest", "2026-06-12T10:00:00.000Z"),
      event("duplicate-second", "2026-06-12T09:00:00.000Z"),
      event("new-third", "2026-06-12T08:00:00.000Z"),
      event("new-fourth", "2026-06-12T07:00:00.000Z"),
      event("new-fifth", "2026-06-12T06:00:00.000Z"),
    ]

    const result = selectUnpostedDuaBotEvents(candidates, new Set(["duplicate-newest", "duplicate-second"]), 2)

    assert.deepEqual(
      result.events.map((candidate) => candidate.key),
      ["new-third", "new-fourth"],
    )
    assert.equal(result.totalMatched, 5)
    assert.equal(result.skippedDuplicates, 2)
  })
})
