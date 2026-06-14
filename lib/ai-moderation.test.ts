import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { evaluateDuaModeration } from "./ai-moderation"

describe("AI dua moderation", () => {
  it("keeps hardship prayer language safe without AI", async () => {
    const result = await evaluateDuaModeration({
      text: "Please make dua for my mother who is ill and grieving after a disaster.",
      settings: { enabled: false, provider: "none", model: "", apiKey: null, modelMode: "manual", moderationTimeoutMs: 9000 },
    })

    assert.equal(result.flagged, false)
    assert.equal(result.severity, "safe")
  })

  it("blocks severe abusive local content before provider calls", async () => {
    let providerCalled = false
    const result = await evaluateDuaModeration({
      text: "I will kill you and destroy your family",
      settings: { enabled: true, provider: "openai", model: "gpt-4o-mini", apiKey: "sk-test", modelMode: "manual", moderationTimeoutMs: 9000 },
      providerClient: async () => {
        providerCalled = true
        return { flagged: false, severity: "safe", reason: "safe" }
      },
    })

    assert.equal(providerCalled, false)
    assert.equal(result.flagged, true)
    assert.equal(result.severity, "block")
  })

  it("uses provider review results for ambiguous unsafe context", async () => {
    const result = await evaluateDuaModeration({
      text: "A phrase that needs context-aware review from the provider.",
      settings: { enabled: true, provider: "openai", model: "gpt-4o-mini", apiKey: "sk-test", modelMode: "manual", moderationTimeoutMs: 9000 },
      providerClient: async () => ({
        flagged: true,
        severity: "review",
        reason: "Potential harassment toward a named person.",
      }),
    })

    assert.equal(result.flagged, true)
    assert.equal(result.severity, "review")
    assert.match(result.reason, /harassment/i)
  })

  it("fails open (publishes) when the provider errors or times out", async () => {
    const result = await evaluateDuaModeration({
      text: "Please review this dua through the configured AI provider.",
      settings: { enabled: true, provider: "openai", model: "gpt-4o-mini", apiKey: "sk-test", modelMode: "manual", moderationTimeoutMs: 9000 },
      providerClient: async () => {
        throw new Error("network timeout")
      },
    })

    // A provider error/timeout carries no content signal — publish rather than
    // bury the dua. The local keyword pre-filter still screens obvious abuse.
    assert.equal(result.flagged, false)
    assert.equal(result.severity, "safe")
    assert.equal(result.source, "error")
    assert.match(result.reason, /unavailable/i)
  })
})
