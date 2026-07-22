import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { isLatinScriptLanguage } from "./detect-language"

describe("isLatinScriptLanguage", () => {
  it("uses known supported Latin-script language names", () => {
    assert.equal(isLatinScriptLanguage("English"), true)
    assert.equal(isLatinScriptLanguage("Turkish"), true)
    assert.equal(isLatinScriptLanguage("French"), true)
    assert.equal(isLatinScriptLanguage("Spanish"), true)
    assert.equal(isLatinScriptLanguage("Indonesian"), true)
    assert.equal(isLatinScriptLanguage("Malay"), true)
    assert.equal(isLatinScriptLanguage("Somali"), true)
    assert.equal(isLatinScriptLanguage("Hausa"), true)
    assert.equal(isLatinScriptLanguage("Swahili"), true)
  })

  it("does not apply Latin typography to known non-Latin language names", () => {
    assert.equal(isLatinScriptLanguage("Arabic", "Please help my family"), false)
    assert.equal(isLatinScriptLanguage("Urdu", "Please help my family"), false)
    assert.equal(isLatinScriptLanguage("Bengali", "Please help my family"), false)
    assert.equal(isLatinScriptLanguage("Persian", "Please help my family"), false)
    assert.equal(isLatinScriptLanguage("Hindi", "Please help my family"), false)
  })

  it("falls back to text content when language metadata is missing or unknown", () => {
    assert.equal(isLatinScriptLanguage(undefined, "Please grant us ease."), true)
    assert.equal(isLatinScriptLanguage("Custom", "Ya Allah, guide us."), true)
    assert.equal(isLatinScriptLanguage(undefined, "اللهم اغفر لنا"), false)
    assert.equal(isLatinScriptLanguage(undefined, "Please grant us ease اللهم"), false)
  })
})
