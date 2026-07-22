import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { describeAiProviderRuntimeStatus } from "./ai-provider-settings-server"

describe("AI provider runtime status", () => {
  it("reports reusable provider capability fields for moderation and bots", () => {
    const status = describeAiProviderRuntimeStatus({
      enabled: true,
      provider: "openai",
      model: "gpt-4o-mini",
      apiKey: "sk-test",
    })

    assert.equal(status.configuredProvider, "openai")
    assert.equal(status.model, "gpt-4o-mini")
    assert.equal(status.hasApiKey, true)
    assert.equal(status.enabledForModeration, true)
    assert.equal(status.enabledForBots, true)
    assert.equal(status.ready, true)
  })

  it("keeps the provider visible when disabled but marks runtime capabilities off", () => {
    const status = describeAiProviderRuntimeStatus({
      enabled: false,
      provider: "openai",
      model: "gpt-4o-mini",
      apiKey: "sk-test",
    })

    assert.equal(status.configuredProvider, "openai")
    assert.equal(status.hasApiKey, true)
    assert.equal(status.enabledForModeration, false)
    assert.equal(status.enabledForBots, false)
    assert.equal(status.ready, false)
  })
})
