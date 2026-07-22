import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { buildDuplicateDuaBotDraft, buildDuplicateDuaBotInsert } from "./dua-bot-duplicates"
import type { DuaBot } from "./dua-bots"

const baseBot: DuaBot = {
  id: 7,
  name: "Humanitarian Crisis Watch",
  description: "Tracks global humanitarian emergencies",
  system_prompt: "Avoid graphic details and keep the duas compassionate.",
  status: "active",
  frequency_minutes: 120,
  max_duas_per_run: 5,
  source_type: "rss",
  rss_urls: ["https://example.com/feed.xml"],
  keywords: ["earthquake", "flood"],
  categories: ["disaster", "humanitarian"],
  tone: "compassionate",
  language: "English",
  target_category_id: 42,
  auto_categorize: false,
  web_search_enabled: true,
  publish_mode: "published",
  last_run_at: "2026-06-01T00:00:00.000Z",
  next_run_at: "2026-06-01T02:00:00.000Z",
  last_status: "success",
  last_error: null,
  created_by: "creator-user",
  updated_by: "updater-user",
  created_at: "2026-06-01T00:00:00.000Z",
  updated_at: "2026-06-01T01:00:00.000Z",
}

describe("dua bot duplicates", () => {
  it("builds a prefilled draft without runtime fields", () => {
    const draft = buildDuplicateDuaBotDraft(baseBot)

    assert.deepEqual(draft, {
      name: "Humanitarian Crisis Watch (copy)",
      description: "Tracks global humanitarian emergencies",
      systemPrompt: "Avoid graphic details and keep the duas compassionate.",
      status: "paused",
      frequencyMinutes: 120,
      maxDuasPerRun: 5,
      sourceType: "rss",
      rssUrls: ["https://example.com/feed.xml"],
      keywords: ["earthquake", "flood"],
      categories: ["disaster", "humanitarian"],
      tone: "compassionate",
      language: "English",
      targetCategoryId: 42,
      autoCategorize: false,
      webSearchEnabled: true,
      publishMode: "published",
    })
  })

  it("copies configuration while pausing and resetting runtime state", () => {
    const duplicate = buildDuplicateDuaBotInsert(baseBot, "admin-user")

    assert.deepEqual(duplicate, {
      name: "Humanitarian Crisis Watch (copy)",
      description: "Tracks global humanitarian emergencies",
      system_prompt: "Avoid graphic details and keep the duas compassionate.",
      status: "paused",
      frequency_minutes: 120,
      max_duas_per_run: 5,
      source_type: "rss",
      rss_urls: ["https://example.com/feed.xml"],
      keywords: ["earthquake", "flood"],
      categories: ["disaster", "humanitarian"],
      tone: "compassionate",
      language: "English",
      target_category_id: 42,
      auto_categorize: false,
      web_search_enabled: true,
      publish_mode: "published",
      next_run_at: null,
      created_by: "admin-user",
      updated_by: "admin-user",
    })
  })

  it("keeps copied bot names within the normalized name length limit", () => {
    const duplicate = buildDuplicateDuaBotInsert({ ...baseBot, name: "A".repeat(80) }, "admin-user")

    assert.equal(duplicate.name.length, 80)
    assert.equal(duplicate.name.endsWith(" (copy)"), true)
  })
})
