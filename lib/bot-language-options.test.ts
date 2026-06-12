import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { BOT_LANGUAGE_OPTIONS, getBotLanguageOptions } from "./bot-language-options"

describe("bot language options", () => {
  it("includes the supported bot posting languages", () => {
    assert.deepEqual(BOT_LANGUAGE_OPTIONS, [
      "English",
      "Arabic",
      "Urdu",
      "Turkish",
      "Bengali",
      "French",
      "Spanish",
      "Indonesian",
      "Malay",
      "Somali",
      "Persian",
      "Hindi",
      "Hausa",
      "Swahili",
    ])
  })

  it("preserves an existing custom language as the first option", () => {
    assert.deepEqual(getBotLanguageOptions("Kurdish"), ["Kurdish", ...BOT_LANGUAGE_OPTIONS])
  })

  it("does not duplicate an existing supported language", () => {
    assert.deepEqual(getBotLanguageOptions("arabic"), [...BOT_LANGUAGE_OPTIONS])
  })
})
