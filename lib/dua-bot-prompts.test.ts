import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { buildDuaBotPromptMessages, normalizeBotInput } from "./dua-bots"

const event = {
  title: "Flooding displaces families",
  summary: "Families need shelter and medical assistance after severe flooding.",
  url: "https://example.com/flooding",
}

describe("dua bot prompt controls", () => {
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
        source_type: "rss",
        rss_urls: ["https://example.com/rss.xml"],
        keywords: [],
        categories: [],
        tone: "compassionate",
        language: "English",
        target_category_id: null,
        publish_mode: "pending",
      },
    })
  })

  it("builds generation messages with safety guidance, bot system prompt, and user prompt", () => {
    const messages = buildDuaBotPromptMessages({
      userPrompt: "Focus on duas for children and families who need urgent relief.",
      systemPrompt: "Use a hopeful, community-oriented framing.",
      event,
      tone: "gentle",
      language: "English",
    })

    assert.equal(messages.length, 2)
    assert.equal(messages[0].role, "system")
    assert.match(messages[0].content, /compassionate/i)
    assert.match(messages[0].content, /non-political/i)
    assert.match(messages[0].content, /non-sectarian/i)
    assert.match(messages[0].content, /no fabricated facts/i)
    assert.match(messages[0].content, /Use a hopeful, community-oriented framing\./)

    assert.equal(messages[1].role, "user")
    assert.match(messages[1].content, /Write one dua in English\./)
    assert.match(messages[1].content, /Tone: gentle\./)
    assert.match(messages[1].content, /User prompt: Focus on duas for children and families who need urgent relief\./)
    assert.match(messages[1].content, /Event title: "Flooding displaces families"/)
  })
})
