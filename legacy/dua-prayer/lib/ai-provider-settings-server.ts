import {
  isAiProviderReady,
  type AiProvider,
  type AiProviderSettings,
} from "@/lib/ai-provider"

export type AiProviderRuntimeStatusInput = Pick<AiProviderSettings, "enabled" | "provider" | "model" | "apiKey">

export type AiProviderRuntimeStatus = {
  configuredProvider: AiProvider
  model: string
  hasApiKey: boolean
  enabledForModeration: boolean
  enabledForBots: boolean
  ready: boolean
}

export function describeAiProviderRuntimeStatus(settings: AiProviderRuntimeStatusInput): AiProviderRuntimeStatus {
  const ready = isAiProviderReady(settings)

  return {
    configuredProvider: settings.provider,
    model: settings.model,
    hasApiKey: Boolean(settings.apiKey),
    enabledForModeration: ready,
    enabledForBots: ready,
    ready,
  }
}
