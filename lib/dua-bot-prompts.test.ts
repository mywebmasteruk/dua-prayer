import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { buildDuaBotPromptMessages, ensureGeneratedBotDuaHasHashtag, normalizeBotInput, sanitizeGeneratedBotDuaText } from "./dua-bots"

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
        max_duas_per_run: 3,
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

  it("instructs generated bot duas to omit closing affirmation variants", () => {
    const messages = buildDuaBotPromptMessages({
      event,
      tone: "gentle",
      language: "English",
    })

    assert.match(messages[0].content, /must not include/i)
    assert.match(messages[0].content, /Amen/i)
    assert.match(messages[0].content, /Ameen/i)
  })

  it("removes closing affirmation variants from generated bot dua text", () => {
    assert.equal(sanitizeGeneratedBotDuaText("May Allah protect them. Amen"), "May Allah protect them.")
    assert.equal(sanitizeGeneratedBotDuaText("amen, may Allah grant relief."), "may Allah grant relief.")
    assert.equal(sanitizeGeneratedBotDuaText("May Allah grant safety AMEEN."), "May Allah grant safety")
    assert.equal(sanitizeGeneratedBotDuaText("May Allah grant patience and ameen hope."), "May Allah grant patience and hope.")
  })

  it("instructs generated bot duas to include relevant hashtags", () => {
    const messages = buildDuaBotPromptMessages({
      event,
      tone: "gentle",
      language: "English",
    })

    assert.match(messages[0].content, /hashtag/i)
    assert.match(messages[1].content, /hashtag/i)
  })

  it("appends a relevant hashtag when generated bot text has none", () => {
    const result = ensureGeneratedBotDuaHasHashtag("May Allah protect displaced families.", {
      keywords: ["flood relief"],
      categories: ["Emergency Response"],
      event,
    })

    assert.equal(result, "May Allah protect displaced families. #flood-relief")
  })

  it("keeps existing hashtags and falls back safely when no context is available", () => {
    assert.equal(
      ensureGeneratedBotDuaHasHashtag("May Allah grant relief. #FloodRelief", {
        keywords: [],
        categories: [],
        event: { title: "", summary: null, url: null },
      }),
      "May Allah grant relief. #FloodRelief",
    )
    assert.equal(
      ensureGeneratedBotDuaHasHashtag("May Allah grant relief.", {
        keywords: [],
        categories: [],
        event: { title: "", summary: null, url: null },
      }),
      "May Allah grant relief. #DuaPrayer",
    )
  })
})
