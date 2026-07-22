import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { normalizeBotInput } from "./dua-bots"

describe("dua bot input", () => {
  it("normalizes the system prompt separately from the user prompt", () => {
    const result = normalizeBotInput({
      name: "Flood response",
      description: "  Center duas on displaced families and first responders.  ",
      systemPrompt: "  Keep duas short and avoid naming organizations.  ",
      sourceUrls: "https://example.com/rss.xml",
    })

    assert.deepEqual(result, {
      value: {
        name: "Flood response",
        description: "Center duas on displaced families and first responders.",
        system_prompt: "Keep duas short and avoid naming organizations.",
        status: "paused",
        frequency_minutes: 360,
        max_duas_per_run: 3,
        source_type: "rss",
        rss_urls: ["https://example.com/rss.xml"],
        keywords: [],
        categories: [],
        tone: "compassionate",
        language: "English",
        target_category_id: null,
        auto_categorize: false,
        web_search_enabled: false,
        publish_mode: "pending",
      },
    })
  })

  it("requires a system prompt", () => {
    const result = normalizeBotInput({
      name: "No prompt bot",
      sourceUrls: "https://example.com/rss.xml",
    })
    assert.ok("error" in result)
  })
})
