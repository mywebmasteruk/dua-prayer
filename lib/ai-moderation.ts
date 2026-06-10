import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { isMissingTableError } from "@/lib/db-errors"
import { SITE_SETTING_KEYS } from "@/lib/settings-keys"

export type AiModerationProvider = "none" | "openai"
export type ModerationSeverity = "safe" | "review" | "block"

export type AiModerationSettings = {
  enabled: boolean
  provider: AiModerationProvider
  model: string
  apiKey: string | null
}

export type AiModerationAdminView = {
  enabled: boolean
  provider: AiModerationProvider
  model: string
  hasApiKey: boolean
  apiKeyLast4: string | null
  ready: boolean
}

export type ModerationResult = {
  flagged: boolean
  severity: ModerationSeverity
  reason: string
  source: "local" | "provider" | "disabled" | "configuration" | "error"
}

type ProviderClient = (input: {
  text: string
  settings: AiModerationSettings
  signal: AbortSignal
}) => Promise<Omit<ModerationResult, "source">>

export type EvaluateDuaModerationInput = {
  text: string
  settings: AiModerationSettings
  providerClient?: ProviderClient
}

const DEFAULT_MODEL = "gpt-4o-mini"
const MODERATION_TIMEOUT_MS = 8_000
const MAX_REASON_LENGTH = 240

const LOCAL_BLOCK_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\b(kill|murder|slaughter|assassinate)\s+(you|him|her|them|everyone|people)\b/i, reason: "Threatening violent language" },
  { pattern: /\b(i\s+will|i'm\s+going\s+to|im\s+going\s+to)\s+(kill|murder|destroy|hurt)\b/i, reason: "Threatening violent language" },
  { pattern: /\b(go\s+kill\s+yourself|kys)\b/i, reason: "Self-harm harassment" },
]

function trimOrNull(value: string | undefined | null): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function lastFour(value: string): string {
  return value.length <= 4 ? value : value.slice(-4)
}

export function isAiModerationProvider(value: string | null | undefined): value is AiModerationProvider {
  return value === "none" || value === "openai"
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim()
}

function sanitizeReason(reason: string | null | undefined): string {
  const normalized = normalizeText(reason ?? "")
  return normalized.slice(0, MAX_REASON_LENGTH) || "Moderation policy matched."
}

function normalizeSeverity(value: string | null | undefined, flagged: boolean): ModerationSeverity {
  if (value === "safe" || value === "review" || value === "block") return value
  return flagged ? "review" : "safe"
}

function localModeration(text: string): ModerationResult | null {
  for (const item of LOCAL_BLOCK_PATTERNS) {
    if (item.pattern.test(text)) {
      return {
        flagged: true,
        severity: "block",
        reason: item.reason,
        source: "local",
      }
    }
  }
  return null
}

export async function fetchAiModerationSettings(): Promise<AiModerationSettings> {
  let supabase
  try {
    supabase = createAdminSupabaseClient()
  } catch (error) {
    console.error("AI moderation settings: Supabase admin client unavailable", error)
    return { enabled: false, provider: "none", model: DEFAULT_MODEL, apiKey: null }
  }

  const keys = [
    SITE_SETTING_KEYS.aiModerationEnabled,
    SITE_SETTING_KEYS.aiModerationProvider,
    SITE_SETTING_KEYS.aiModerationModel,
    SITE_SETTING_KEYS.aiModerationApiKey,
  ]
  const { data, error } = await supabase.from("site_settings").select("key, value").in("key", keys)

  if (error) {
    if (!isMissingTableError(error)) {
      console.error("Error fetching AI moderation settings:", error)
    }
    return { enabled: false, provider: "none", model: DEFAULT_MODEL, apiKey: null }
  }

  const byKey = new Map((data ?? []).map((row) => [row.key, row.value]))
  const providerRaw = trimOrNull(byKey.get(SITE_SETTING_KEYS.aiModerationProvider))
  const provider = isAiModerationProvider(providerRaw) ? providerRaw : "none"

  return {
    enabled: byKey.get(SITE_SETTING_KEYS.aiModerationEnabled) === "true",
    provider,
    model: trimOrNull(byKey.get(SITE_SETTING_KEYS.aiModerationModel)) ?? DEFAULT_MODEL,
    apiKey: trimOrNull(byKey.get(SITE_SETTING_KEYS.aiModerationApiKey)),
  }
}

export async function getAiModerationAdminView(): Promise<AiModerationAdminView> {
  const settings = await fetchAiModerationSettings()
  return {
    enabled: settings.enabled,
    provider: settings.provider,
    model: settings.model,
    hasApiKey: Boolean(settings.apiKey),
    apiKeyLast4: settings.apiKey ? lastFour(settings.apiKey) : null,
    ready: settings.enabled && settings.provider === "openai" && Boolean(settings.apiKey),
  }
}

function buildModerationPrompt(text: string): string {
  return [
    "You moderate public duas/prayer requests for a respectful Muslim community platform.",
    "Flag negative or unsafe words/context including abuse, hate, threats, harassment, self-harm encouragement, sexual content, doxxing/private personal details, political incitement, scams, or targeted attacks.",
    "Do not flag normal hardship or sincere prayer context just because it mentions illness, grief, disaster, poverty, fear, oppression, death, or other difficult life events.",
    "Return strict JSON only with keys: flagged boolean, severity one of safe/review/block, reason short string.",
    "Use review for ambiguous content needing admin review. Use block only for severe threats, hate, explicit harassment, sexual content, doxxing, or clear incitement.",
    `Dua text: ${JSON.stringify(text)}`,
  ].join("\n")
}

async function callOpenAiModeration({ text, settings, signal }: Parameters<ProviderClient>[0]): Promise<Omit<ModerationResult, "source">> {
  if (!settings.apiKey) {
    return {
      flagged: true,
      severity: "review",
      reason: "AI moderation is enabled but the API key is not configured.",
    }
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: settings.model || DEFAULT_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a conservative but context-aware content moderation classifier. Return JSON only.",
        },
        { role: "user", content: buildModerationPrompt(text) },
      ],
    }),
    signal,
  })

  if (!response.ok) {
    throw new Error(`OpenAI moderation failed with status ${response.status}`)
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>
  }
  const content = payload.choices?.[0]?.message?.content
  if (!content) throw new Error("OpenAI moderation returned no content")

  const parsed = JSON.parse(content) as { flagged?: unknown; severity?: unknown; reason?: unknown }
  const flagged = parsed.flagged === true
  const severity = normalizeSeverity(typeof parsed.severity === "string" ? parsed.severity : null, flagged)

  return {
    flagged: severity !== "safe" || flagged,
    severity,
    reason: sanitizeReason(typeof parsed.reason === "string" ? parsed.reason : null),
  }
}

async function withTimeout<T>(callback: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), MODERATION_TIMEOUT_MS)
  try {
    return await callback(controller.signal)
  } finally {
    clearTimeout(timeout)
  }
}

export async function evaluateDuaModeration({
  text,
  settings,
  providerClient,
}: EvaluateDuaModerationInput): Promise<ModerationResult> {
  const normalized = normalizeText(text)
  const localResult = localModeration(normalized)
  if (localResult) return localResult

  if (!settings.enabled || settings.provider === "none") {
    return { flagged: false, severity: "safe", reason: "AI moderation disabled.", source: "disabled" }
  }

  if (settings.provider !== "openai") {
    return {
      flagged: true,
      severity: "review",
      reason: "AI moderation provider is not supported yet.",
      source: "configuration",
    }
  }

  const client = providerClient ?? callOpenAiModeration
  try {
    const result = await withTimeout((signal) => client({ text: normalized, settings, signal }))
    const severity = normalizeSeverity(result.severity, result.flagged)
    return {
      flagged: severity !== "safe" || result.flagged,
      severity,
      reason: sanitizeReason(result.reason),
      source: "provider",
    }
  } catch {
    return {
      flagged: true,
      severity: "review",
      reason: "AI moderation is temporarily unavailable; queued for manual review.",
      source: "error",
    }
  }
}
