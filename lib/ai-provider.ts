import { unstable_cache } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { isMissingTableError } from "@/lib/db-errors"
import { SITE_SETTING_KEYS } from "@/lib/settings-keys"
import { PROVIDER_CATALOG, AI_PROVIDER_IDS, type AiProvider } from "@/lib/ai-provider-catalog"

export type { AiProvider } from "@/lib/ai-provider-catalog"

export type ModelMode = "auto" | "manual"

export type AiProviderSettings = {
  enabled: boolean
  provider: AiProvider
  /** The effective model to call (auto-resolved when modelMode === "auto"). */
  model: string
  apiKey: string | null
  modelMode: ModelMode
  /** Max ms to wait for a moderation verdict before failing open. */
  moderationTimeoutMs: number
}

export type AiProviderAdminView = {
  enabled: boolean
  provider: AiProvider
  model: string
  hasApiKey: boolean
  apiKeyLast4: string | null
  ready: boolean
  modelMode: ModelMode
  moderationTimeoutMs: number
  /** When modelMode === "auto", the model auto-resolution picked (for display). */
  autoModel: string | null
}

export const DEFAULT_MODERATION_TIMEOUT_MS = 9_000
export const MIN_MODERATION_TIMEOUT_MS = 2_000
export const MAX_MODERATION_TIMEOUT_MS = 30_000

/** Safe free model used if auto-resolution can't reach OpenRouter. */
const AUTO_FREE_FALLBACK_MODEL = "openai/gpt-oss-120b:free"

export function clampModerationTimeout(value: number | null | undefined): number {
  if (!value || !Number.isFinite(value)) return DEFAULT_MODERATION_TIMEOUT_MS
  return Math.min(MAX_MODERATION_TIMEOUT_MS, Math.max(MIN_MODERATION_TIMEOUT_MS, Math.round(value)))
}

// Preferred free model families, best first. Auto-mode picks the NEWEST free
// model whose id matches one of these (so new releases in a trusted family are
// adopted automatically); falls back to the newest free chat model otherwise.
// This list rarely changes — the actual model is resolved live, not hardcoded.
const PREFERRED_FREE_FAMILIES = [
  "gpt-oss-120b",
  "llama-3.3-70b",
  "qwen3",
  "gemma-4",
  "gemma-3",
  "mistral",
  "deepseek",
  "llama-3.1-70b",
]

// Free models that don't fit text moderation (wrong I/O or non-JSON output).
const EXCLUDED_FREE_MODEL_RE = /audio|whisper|tts|image|vision|embed|lyria|guard|safety|content-safety|coder|owl|clip/i

type OpenRouterModel = {
  id: string
  created?: number
  pricing?: { prompt?: string; completion?: string }
  architecture?: { modality?: string; input_modalities?: string[]; output_modalities?: string[] }
}

function isFreeTextModel(m: OpenRouterModel): boolean {
  const promptFree = Number(m.pricing?.prompt ?? "1") === 0
  const completionFree = Number(m.pricing?.completion ?? "1") === 0
  if (!promptFree || !completionFree) return false
  if (EXCLUDED_FREE_MODEL_RE.test(m.id)) return false
  const modality = m.architecture?.modality ?? ""
  // Require a text-producing chat model.
  if (modality && !modality.includes("text")) return false
  return m.id.endsWith(":free") || m.id.startsWith("openrouter/")
}

async function fetchLatestFreeModel(): Promise<string> {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", { signal: AbortSignal.timeout(8_000) })
    if (!res.ok) return AUTO_FREE_FALLBACK_MODEL
    const data = (await res.json()) as { data?: OpenRouterModel[] }
    const free = (data.data ?? []).filter(isFreeTextModel)
    if (free.length === 0) return AUTO_FREE_FALLBACK_MODEL

    const byCreatedDesc = [...free].sort((a, b) => (b.created ?? 0) - (a.created ?? 0))
    // Prefer the newest model from a trusted family; else the newest free chat model.
    for (const family of PREFERRED_FREE_FAMILIES) {
      const match = byCreatedDesc.find((m) => m.id.includes(family))
      if (match) return match.id
    }
    return byCreatedDesc[0]?.id ?? AUTO_FREE_FALLBACK_MODEL
  } catch {
    return AUTO_FREE_FALLBACK_MODEL
  }
}

/** Latest capable free OpenRouter model, refreshed daily. */
export const resolveLatestFreeModel = unstable_cache(fetchLatestFreeModel, ["latest-free-model"], {
  revalidate: 86_400,
  tags: ["ai-provider-settings"],
})

type GenerateDuaInput = {
  eventTitle: string
  eventSummary?: string | null
  eventUrl?: string | null
  tone: string
  language: string
  messages?: ChatMessage[]
  settings: AiProviderSettings
  signal?: AbortSignal
}

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string }

const AI_TIMEOUT_MS = 10_000
const MAX_DUA_LENGTH = 280

function trimOrNull(value: string | undefined | null): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function lastFour(value: string): string {
  return value.length <= 4 ? value : value.slice(-4)
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim()
}

function stripJsonFences(content: string): string {
  return content.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim()
}

export function isAiProvider(value: string | null | undefined): value is AiProvider {
  return AI_PROVIDER_IDS.includes(value as AiProvider)
}

export function isAiProviderReady(
  settings: Pick<AiProviderSettings, "enabled" | "provider" | "apiKey">,
): boolean {
  if (!settings.enabled || settings.provider === "none") return false
  if (settings.provider === "ollama") return true
  return Boolean(settings.apiKey)
}

const DISABLED_SETTINGS: AiProviderSettings = {
  enabled: false,
  provider: "none",
  model: "gpt-4o-mini",
  apiKey: null,
  modelMode: "manual",
  moderationTimeoutMs: DEFAULT_MODERATION_TIMEOUT_MS,
}

export async function fetchAiProviderSettings(): Promise<AiProviderSettings> {
  let supabase
  try {
    supabase = createAdminSupabaseClient()
  } catch (error) {
    console.error("AI provider settings: Supabase admin client unavailable", error)
    return { ...DISABLED_SETTINGS }
  }

  const keys = [
    SITE_SETTING_KEYS.aiProviderEnabled,
    SITE_SETTING_KEYS.aiProviderProvider,
    SITE_SETTING_KEYS.aiProviderModel,
    SITE_SETTING_KEYS.aiProviderApiKey,
    SITE_SETTING_KEYS.aiProviderModelMode,
    SITE_SETTING_KEYS.aiModerationTimeoutMs,
  ]
  const { data, error } = await supabase.from("site_settings").select("key, value").in("key", keys)

  if (error) {
    if (!isMissingTableError(error)) {
      console.error("Error fetching AI provider settings:", error)
    }
    return { ...DISABLED_SETTINGS }
  }

  const byKey = new Map((data ?? []).map((row) => [row.key, row.value]))
  const providerRaw = trimOrNull(byKey.get(SITE_SETTING_KEYS.aiProviderProvider))
  const provider = isAiProvider(providerRaw) ? providerRaw : "none"
  const defaultModel = provider !== "none" ? (PROVIDER_CATALOG[provider]?.defaultModel ?? "gpt-4o-mini") : "gpt-4o-mini"
  const modelMode: ModelMode = byKey.get(SITE_SETTING_KEYS.aiProviderModelMode) === "auto" ? "auto" : "manual"
  const storedModel = trimOrNull(byKey.get(SITE_SETTING_KEYS.aiProviderModel)) ?? defaultModel

  // Auto mode self-updates the model — only meaningful for OpenRouter's free
  // catalog. Resolution is cached daily and falls back safely on error.
  const model =
    modelMode === "auto" && provider === "openrouter" ? await resolveLatestFreeModel() : storedModel

  return {
    enabled: byKey.get(SITE_SETTING_KEYS.aiProviderEnabled) === "true",
    provider,
    model,
    apiKey: trimOrNull(byKey.get(SITE_SETTING_KEYS.aiProviderApiKey)),
    modelMode,
    moderationTimeoutMs: clampModerationTimeout(Number(byKey.get(SITE_SETTING_KEYS.aiModerationTimeoutMs))),
  }
}

export async function getAiProviderAdminView(): Promise<AiProviderAdminView> {
  const settings = await fetchAiProviderSettings()
  return {
    enabled: settings.enabled,
    provider: settings.provider,
    model: settings.model,
    hasApiKey: Boolean(settings.apiKey),
    apiKeyLast4: settings.apiKey ? lastFour(settings.apiKey) : null,
    ready: isAiProviderReady(settings),
    modelMode: settings.modelMode,
    moderationTimeoutMs: settings.moderationTimeoutMs,
    autoModel: settings.modelMode === "auto" && settings.provider === "openrouter" ? settings.model : null,
  }
}

async function withTimeout<T>(callback: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS)
  try {
    return await callback(controller.signal)
  } finally {
    clearTimeout(timeout)
  }
}

export async function callProviderChat(
  settings: AiProviderSettings,
  messages: ChatMessage[],
  signal: AbortSignal,
): Promise<string> {
  const { provider, apiKey, model } = settings
  if (provider === "none") throw new Error("No AI provider configured.")

  const meta = PROVIDER_CATALOG[provider]
  const systemMsg = messages.find((m) => m.role === "system")?.content ?? ""
  const userMsg = messages.find((m) => m.role === "user")?.content ?? ""
  const jsonInstruction = "\n\nReturn ONLY valid JSON. No markdown, no explanation."

  if (provider === "anthropic") {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey ?? "",
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || meta.defaultModel,
        max_tokens: 512,
        system: systemMsg,
        messages: [{ role: "user", content: `${userMsg}${jsonInstruction}` }],
      }),
      signal,
    })
    if (!response.ok) throw new Error(`Anthropic request failed with status ${response.status}`)
    const payload = (await response.json()) as { content?: Array<{ type: string; text?: string }> }
    const content = payload.content?.find((c) => c.type === "text")?.text
    if (!content) throw new Error("Anthropic returned no content")
    return stripJsonFences(content)
  }

  if (provider === "google") {
    const modelId = model || meta.defaultModel
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey ?? ""}`
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: systemMsg ? { parts: [{ text: systemMsg }] } : undefined,
        contents: [{ role: "user", parts: [{ text: `${userMsg}${jsonInstruction}` }] }],
        generationConfig: { temperature: 0.4 },
      }),
      signal,
    })
    if (!response.ok) throw new Error(`Google Gemini request failed with status ${response.status}`)
    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }
    const content = payload.candidates?.[0]?.content?.parts?.[0]?.text
    if (!content) throw new Error("Google Gemini returned no content")
    return stripJsonFences(content)
  }

  if (provider === "cohere") {
    const response = await fetch("https://api.cohere.com/v2/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey ?? ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || meta.defaultModel,
        messages: [
          ...(systemMsg ? [{ role: "system", content: systemMsg }] : []),
          { role: "user", content: `${userMsg}${jsonInstruction}` },
        ],
        temperature: 0.4,
      }),
      signal,
    })
    if (!response.ok) throw new Error(`Cohere request failed with status ${response.status}`)
    const payload = (await response.json()) as {
      message?: { content?: Array<{ type: string; text?: string }> }
    }
    const content = payload.message?.content?.find((c) => c.type === "text")?.text
    if (!content) throw new Error("Cohere returned no content")
    return stripJsonFences(content)
  }

  // OpenAI-compatible providers: openai, mistral, groq, together, deepseek, xai, perplexity, ollama
  const needsJsonHint = !meta.supportsJsonMode
  const response = await fetch(`${meta.apiBase}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey ?? ""}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model || meta.defaultModel,
      temperature: 0.4,
      ...(meta.supportsJsonMode ? { response_format: { type: "json_object" } } : {}),
      messages: messages.map((m) =>
        m.role === "user" && needsJsonHint ? { ...m, content: `${m.content}${jsonInstruction}` } : m,
      ),
    }),
    signal,
  })
  if (!response.ok) throw new Error(`${meta.label} request failed with status ${response.status}`)
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>
  }
  const content = payload.choices?.[0]?.message?.content
  if (!content) throw new Error(`${meta.label} returned no content`)
  return stripJsonFences(content)
}

export async function generateDuaForEvent({
  eventTitle,
  eventSummary,
  eventUrl,
  tone,
  language,
  messages: customMessages,
  settings,
  signal,
}: GenerateDuaInput): Promise<string> {
  if (!isAiProviderReady(settings)) {
    const providerLabel = settings.provider !== "none" ? PROVIDER_CATALOG[settings.provider]?.label : null
    throw new Error(
      providerLabel
        ? `${providerLabel} is configured but the API key is missing. Save an API key under Admin → Integration → AI Provider.`
        : "AI Provider is not configured. Enable a provider and save an API key under Admin → Integration → AI Provider.",
    )
  }

  const messages: ChatMessage[] = customMessages ?? [
    {
      role: "system",
      content: "You write concise, compassionate duas for a Muslim community platform. Return strict JSON only.",
    },
    {
      role: "user",
      content: [
        `Write one dua in ${language}.`,
        `Tone: ${tone}.`,
        "The dua should ask the Ummah to pray for people affected by the event, including those suffering, grieving, displaced, injured, or who lost loved ones when relevant.",
        "Do not invent casualty counts, locations, names, or religious rulings not present in the event.",
        `Keep it under ${MAX_DUA_LENGTH} characters and return JSON: {"dua": string}.`,
        `Event title: ${JSON.stringify(eventTitle)}`,
        eventSummary ? `Event summary: ${JSON.stringify(eventSummary)}` : "",
        eventUrl ? `Event URL: ${JSON.stringify(eventUrl)}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ]

  const run = async (requestSignal: AbortSignal) => {
    const raw = await callProviderChat(settings, messages, signal ?? requestSignal)
    const parsed = JSON.parse(raw) as { dua?: unknown }
    const dua = normalizeText(typeof parsed.dua === "string" ? parsed.dua : "")
    if (dua.length < 15) throw new Error("AI Provider returned a dua that was too short")
    return dua.slice(0, MAX_DUA_LENGTH)
  }

  return signal ? run(signal) : withTimeout(run)
}
