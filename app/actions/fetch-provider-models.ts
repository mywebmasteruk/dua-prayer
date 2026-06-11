"use server"

import { getAdminContext, hasPermission } from "@/lib/auth"
import { PROVIDER_CATALOG, type AiProvider } from "@/lib/ai-provider-catalog"
import { fetchAiProviderSettings } from "@/lib/ai-provider"

type FetchModelsResult = { models: string[] } | { error: string }

function canManage(ctx: NonNullable<Awaited<ReturnType<typeof getAdminContext>>>) {
  return ctx.isFoundingAdmin || hasPermission(ctx, "manage_settings")
}

export async function fetchProviderModels(provider: AiProvider, newApiKey?: string): Promise<FetchModelsResult> {
  const ctx = await getAdminContext()
  if (!ctx || !canManage(ctx)) return { error: "Unauthorized" }

  if (provider === "none") return { models: [] }

  const meta = PROVIDER_CATALOG[provider]
  if (!meta) return { error: "Unknown provider" }

  // Resolve API key: prefer the newly-entered one, fall back to stored key
  const apiKey = newApiKey?.trim() || (provider !== "ollama" ? (await fetchAiProviderSettings()).apiKey ?? "" : "")

  // Providers with no models endpoint return hardcoded fallbacks
  if (!meta.modelsEndpoint) {
    return { models: meta.fallbackModels }
  }

  try {
    if (provider === "ollama") {
      const response = await fetch(meta.modelsEndpoint, { signal: AbortSignal.timeout(5_000) })
      if (!response.ok) return { models: meta.fallbackModels }
      const data = (await response.json()) as { models?: Array<{ name: string }> }
      const models = (data.models ?? []).map((m) => m.name).filter(Boolean)
      return { models: models.length > 0 ? models : meta.fallbackModels }
    }

    if (provider === "google") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      const response = await fetch(url, { signal: AbortSignal.timeout(5_000) })
      if (!response.ok) return { models: meta.fallbackModels }
      const data = (await response.json()) as {
        models?: Array<{ name: string; supportedGenerationMethods?: string[] }>
      }
      const models = (data.models ?? [])
        .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
        .map((m) => m.name.replace(/^models\//, ""))
        .filter(Boolean)
      return { models: models.length > 0 ? models : meta.fallbackModels }
    }

    if (provider === "together") {
      const response = await fetch(meta.modelsEndpoint, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(8_000),
      })
      if (!response.ok) return { models: meta.fallbackModels }
      const data = (await response.json()) as Array<{ id: string; type?: string }>
      const models = (Array.isArray(data) ? data : [])
        .filter((m) => !m.type || m.type === "chat")
        .map((m) => m.id)
        .filter(Boolean)
        .sort()
      return { models: models.length > 0 ? models : meta.fallbackModels }
    }

    // Standard OpenAI-compatible /models endpoint
    const response = await fetch(meta.modelsEndpoint, {
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(8_000),
    })
    if (!response.ok) return { models: meta.fallbackModels }

    const data = (await response.json()) as { data?: Array<{ id: string }> }
    const models = (data.data ?? []).map((m) => m.id).filter(Boolean).sort()
    return { models: models.length > 0 ? models : meta.fallbackModels }
  } catch {
    return { models: meta.fallbackModels }
  }
}
