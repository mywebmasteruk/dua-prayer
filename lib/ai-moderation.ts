import {
  fetchAiProviderSettings,
  getAiProviderAdminView,
  isAiProvider,
  isAiProviderReady,
  callProviderChat,
  type AiProvider,
  type AiProviderAdminView,
  type AiProviderSettings,
} from "@/lib/ai-provider"

export type AiModerationProvider = AiProvider
export type AiModerationSettings = AiProviderSettings
export type AiModerationAdminView = AiProviderAdminView
export type ModerationSeverity = "safe" | "review" | "block"

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

// Caps worst-case submit latency. Free-tier models are slow and variable
// (observed 3-6s), so 4s aborted legitimate calls; 9s gives normal responses
// headroom. A timeout/error fails OPEN (publishes) — see evaluateDuaModeration
// catch — because an aborted or rate-limited request carries no signal about
// the content, and the local keyword pre-filter has already screened it.
const MODERATION_TIMEOUT_MS = 9_000
const MAX_REASON_LENGTH = 240

const LOCAL_BLOCK_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\b(kill|murder|slaughter|assassinate)\s+(you|him|her|them|everyone|people)\b/i, reason: "Threatening violent language" },
  { pattern: /\b(i\s+will|i'm\s+going\s+to|im\s+going\s+to)\s+(kill|murder|destroy|hurt)\b/i, reason: "Threatening violent language" },
  { pattern: /\b(go\s+kill\s+yourself|kys)\b/i, reason: "Self-harm harassment" },
]

export const isAiModerationProvider = isAiProvider
export const fetchAiModerationSettings = fetchAiProviderSettings
export const getAiModerationAdminView = getAiProviderAdminView

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

async function callProviderModeration({ text, settings, signal }: Parameters<ProviderClient>[0]): Promise<Omit<ModerationResult, "source">> {
  if (!isAiProviderReady(settings)) {
    return {
      flagged: true,
      severity: "review",
      reason: "AI moderation is enabled but the provider is not configured.",
    }
  }

  const raw = await callProviderChat(
    settings,
    [
      {
        role: "system",
        content: "You are a conservative but context-aware content moderation classifier. Return JSON only.",
      },
      { role: "user", content: buildModerationPrompt(text) },
    ],
    signal,
  )

  const parsed = JSON.parse(raw) as { flagged?: unknown; severity?: unknown; reason?: unknown }
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

  const client = providerClient ?? callProviderModeration
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
    // Fail OPEN: a timeout, network error, or rate-limit (429) from a free-tier
    // provider says nothing about the content. Holding every such dua for review
    // silently buries legitimate posts whenever the free model is slow or
    // throttled. The local keyword pre-filter (localModeration, above) still
    // catches obvious violations offline, and admins can flag anything missed.
    return {
      flagged: false,
      severity: "safe",
      reason: "AI moderation was unavailable; published without an AI check.",
      source: "error",
    }
  }
}
