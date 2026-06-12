import { createHash } from "crypto"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import {
  fetchAiProviderSettings,
  generateDuaForEvent,
  getAiProviderAdminView,
  isAiProviderReady,
  type AiProviderSettings,
} from "@/lib/ai-provider"
import { evaluateDuaModeration } from "@/lib/ai-moderation"

export type BotStatus = "active" | "paused"
export type BotSourceType = "rss"
export type BotPublishMode = "pending" | "published"
export type BotRunStatus = "running" | "success" | "error" | "skipped"
export type BotLastStatus = "never_run" | Exclude<BotRunStatus, "running">

export type DuaBot = {
  id: number
  name: string
  description: string
  status: BotStatus
  frequency_minutes: number
  source_type: BotSourceType
  rss_urls: string[]
  keywords: string[]
  categories: string[]
  tone: string
  language: string
  target_category_id: number | null
  publish_mode: BotPublishMode
  last_run_at: string | null
  next_run_at: string | null
  last_status: BotLastStatus
  last_error: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export type DuaEventBot = DuaBot & {
  source_urls: string[]
  event_categories: string[]
}

export type DuaBotRun = {
  id: number
  bot_id: number
  started_at: string
  finished_at: string | null
  status: BotRunStatus
  events_found: number
  duas_created: number
  message: string | null
  ai_provider: AiProviderSettings["provider"] | null
  ai_model: string | null
}

export type BotFormInput = {
  id?: number
  name: string
  description?: string
  status?: BotStatus
  sourceType?: BotSourceType
  rssUrls?: string | string[]
  sourceUrls?: string | string[]
  keywords?: string | string[]
  categories?: string | string[]
  eventCategories?: string | string[]
  frequencyMinutes?: number
  tone?: string
  language?: string
  targetCategoryId?: number | null
  publishMode?: BotPublishMode
}

export type NormalizedBotInput = {
  name: string
  description: string
  status: BotStatus
  frequency_minutes: number
  source_type: BotSourceType
  rss_urls: string[]
  keywords: string[]
  categories: string[]
  tone: string
  language: string
  target_category_id: number | null
  publish_mode: BotPublishMode
}

export type BotRuntimeStatus = {
  aiProvider: Awaited<ReturnType<typeof getAiProviderAdminView>>
  supportedSourceTypes: BotSourceType[]
  canGenerateDuas: boolean
  helperText: string
}

export type BotRunnerResult = {
  botsChecked: number
  botsRun: number
  duasCreated: number
  errors: Array<{ botId: number; message: string }>
}

type EventCandidate = {
  key: string
  title: string
  summary: string | null
  url: string | null
  publishedAt: string | null
  sourceType: BotSourceType
  sourceUrl: string
}

type EventDiscovery = {
  events: EventCandidate[]
  warnings: string[]
}

const MAX_EVENTS_PER_BOT = 3
const MAX_SOURCE_BYTES = 500_000
const REQUEST_TIMEOUT_MS = 8_000

function normalizeList(value: string | string[] | undefined): string[] {
  const parts = Array.isArray(value) ? value : (value ?? "").split(/[\n,]/)
  return [...new Set(parts.map((item) => item.trim()).filter(Boolean))]
}

function normalizeUrlList(value: string | string[] | undefined): string[] {
  return normalizeList(value).filter((url) => {
    try {
      const parsed = new URL(url)
      return parsed.protocol === "https:" || parsed.protocol === "http:"
    } catch {
      return false
    }
  })
}

function normalizeFrequency(value: number | undefined): number {
  const parsed = Number.isFinite(value) ? Math.trunc(value as number) : 360
  return Math.min(10_080, Math.max(15, parsed))
}

function nextRunDate(frequencyMinutes: number): string {
  return new Date(Date.now() + frequencyMinutes * 60_000).toISOString()
}

function sanitizeText(value: string | undefined, fallback = ""): string {
  return (value ?? fallback).replace(/\s+/g, " ").trim()
}

function stripXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}

function firstTag(xml: string, tag: string): string | null {
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i").exec(xml)
  return match ? stripXml(match[1]) : null
}

function eventKey(sourceUrl: string, title: string, url: string | null): string {
  return createHash("sha256").update(`${sourceUrl}\n${url ?? ""}\n${title}`).digest("hex")
}

function itemBlocks(xml: string): string[] {
  const matches = xml.match(/<item[\s\S]*?<\/item>/gi)
  if (matches?.length) return matches
  return xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? []
}

function parseRssEvents(xml: string, sourceUrl: string): EventCandidate[] {
  return itemBlocks(xml)
    .map((item) => {
      const title = firstTag(item, "title")
      if (!title) return null
      const link = firstTag(item, "link") ?? /<link[^>]+href=["']([^"']+)["']/i.exec(item)?.[1] ?? null
      const summary = firstTag(item, "description") ?? firstTag(item, "summary") ?? firstTag(item, "content")
      const publishedRaw = firstTag(item, "pubDate") ?? firstTag(item, "published") ?? firstTag(item, "updated")
      const published = publishedRaw ? new Date(publishedRaw) : null
      const publishedAt = published && !Number.isNaN(published.getTime()) ? published.toISOString() : null
      return {
        key: eventKey(sourceUrl, title, link),
        title,
        summary,
        url: link,
        publishedAt,
        sourceType: "rss" as const,
        sourceUrl,
      }
    })
    .filter((event): event is EventCandidate => Boolean(event))
}

function matchesBot(bot: DuaBot, event: EventCandidate): boolean {
  const filters = [...bot.keywords, ...bot.categories].map((item) => item.toLowerCase())
  if (filters.length === 0) return true
  const haystack = `${event.title} ${event.summary ?? ""}`.toLowerCase()
  return filters.some((filter) => haystack.includes(filter))
}

function toDuaEventBot(bot: DuaBot): DuaEventBot {
  return {
    ...bot,
    source_urls: bot.rss_urls,
    event_categories: bot.categories,
  }
}

async function fetchWithTimeout(url: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5" },
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`Source returned ${response.status}`)
    const text = await response.text()
    return text.slice(0, MAX_SOURCE_BYTES)
  } finally {
    clearTimeout(timeout)
  }
}

export function normalizeBotInput(input: BotFormInput): { value: NormalizedBotInput } | { error: string } {
  const name = sanitizeText(input.name)
  if (name.length < 2) return { error: "Bot name must be at least 2 characters." }
  if (name.length > 80) return { error: "Bot name must be 80 characters or less." }

  const sourceType = input.sourceType ?? "rss"
  if (sourceType !== "rss") return { error: "Only RSS sources are currently supported." }

  const rssUrls = normalizeUrlList(input.rssUrls ?? input.sourceUrls)
  if (rssUrls.length === 0) {
    return { error: "Add at least one valid RSS/news source URL." }
  }

  const tone = sanitizeText(input.tone, "compassionate")
  const language = sanitizeText(input.language, "English")
  const description = sanitizeText(input.description)

  return {
    value: {
      name,
      description,
      status: input.status === "active" ? "active" : "paused",
      frequency_minutes: normalizeFrequency(input.frequencyMinutes),
      source_type: sourceType,
      rss_urls: rssUrls,
      keywords: normalizeList(input.keywords),
      categories: normalizeList(input.categories ?? input.eventCategories),
      tone: tone.slice(0, 80),
      language: language.slice(0, 80),
      target_category_id: input.targetCategoryId ?? null,
      publish_mode: input.publishMode === "published" ? "published" : "pending",
    },
  }
}

export async function listDuaBots(): Promise<DuaBot[]> {
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin
    .from("dua_bots")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error loading dua bots:", error)
    return []
  }

  return (data ?? []) as DuaBot[]
}

export async function listDuaEventBots(): Promise<DuaEventBot[]> {
  const bots = await listDuaBots()
  return bots.map(toDuaEventBot)
}

export async function listRecentBotRuns(limit = 10): Promise<DuaBotRun[]> {
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin
    .from("dua_bot_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error loading dua bot runs:", error)
    return []
  }

  return (data ?? []) as DuaBotRun[]
}

export async function getDuaBotRuntimeStatus(): Promise<BotRuntimeStatus> {
  const aiProvider = await getAiProviderAdminView()
  const canGenerateDuas = aiProvider.ready
  return {
    aiProvider,
    supportedSourceTypes: ["rss"],
    canGenerateDuas,
    helperText: canGenerateDuas
      ? "Bots can generate duas from configured RSS/news sources."
      : "Configure and enable Admin → Integration → AI Provider before bot runs can create duas.",
  }
}

async function discoverRssEvents(bot: DuaBot): Promise<EventDiscovery> {
  const events: EventCandidate[] = []
  const warnings: string[] = []

  for (const sourceUrl of bot.rss_urls) {
    try {
      const xml = await fetchWithTimeout(sourceUrl)
      events.push(...parseRssEvents(xml, sourceUrl).filter((event) => matchesBot(bot, event)))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      warnings.push(`${sourceUrl}: ${message}`)
      console.warn("Dua bot RSS fetch failed", { botId: bot.id, sourceUrl, error })
    }
  }

  return { events, warnings }
}

async function discoverEvents(bot: DuaBot): Promise<EventDiscovery> {
  switch (bot.source_type) {
    case "rss":
      return discoverRssEvents(bot)
    default: {
      const exhaustive: never = bot.source_type
      return { events: [], warnings: [`Unsupported source type: ${exhaustive}`] }
    }
  }
}

async function createRun(botId: number, aiSettings: AiProviderSettings): Promise<number | null> {
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin
    .from("dua_bot_runs")
    .insert({ bot_id: botId, ai_provider: aiSettings.provider, ai_model: aiSettings.model })
    .select("id")
    .single()
  if (error) {
    console.error("Error creating dua bot run:", error)
    return null
  }
  return data.id as number
}

async function finishRun(runId: number | null, status: BotRunStatus, eventsFound: number, duasCreated: number, message: string | null) {
  if (!runId) return
  const admin = createAdminSupabaseClient()
  const { error } = await admin
    .from("dua_bot_runs")
    .update({
      status,
      events_found: eventsFound,
      duas_created: duasCreated,
      message,
      finished_at: new Date().toISOString(),
    })
    .eq("id", runId)
  if (error) console.error("Error updating dua bot run:", error)
}

async function updateBotRunState(bot: DuaBot, status: Exclude<BotRunStatus, "running">, message: string | null) {
  const admin = createAdminSupabaseClient()
  const { error } = await admin
    .from("dua_bots")
    .update({
      last_run_at: new Date().toISOString(),
      next_run_at: nextRunDate(bot.frequency_minutes),
      last_status: status,
      last_error: status === "error" ? message : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bot.id)
  if (error) console.error("Error updating dua bot state:", error)
}

async function alreadyPosted(botId: number, key: string): Promise<boolean> {
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin
    .from("dua_bot_event_posts")
    .select("id")
    .eq("bot_id", botId)
    .eq("event_key", key)
    .maybeSingle()

  if (error) {
    console.error("Error checking bot event dedupe:", error)
    return true
  }
  return Boolean(data)
}

async function createDuaFromEvent(
  bot: DuaBot,
  runId: number | null,
  event: EventCandidate,
  aiSettings: AiProviderSettings,
): Promise<boolean> {
  if (await alreadyPosted(bot.id, event.key)) return false

  const text = await generateDuaForEvent({
    eventTitle: event.title,
    eventSummary: event.summary,
    eventUrl: event.url,
    tone: bot.tone,
    language: bot.language,
    settings: aiSettings,
  })

  const moderation = await evaluateDuaModeration({ text, settings: aiSettings })
  if (moderation.severity === "block") {
    throw new Error(`Generated dua blocked by moderation: ${moderation.reason}`)
  }

  const requiresReview = bot.publish_mode === "pending" || moderation.flagged || moderation.severity === "review"
  const admin = createAdminSupabaseClient()
  const { data: dua, error: duaError } = await admin
    .from("duas")
    .insert({
      text,
      category_id: bot.target_category_id,
      published: !requiresReview,
      flagged: requiresReview,
      user_id: null,
    })
    .select("id")
    .single()

  if (duaError) throw new Error(duaError.message)

  const { error: postError } = await admin.from("dua_bot_event_posts").insert({
    bot_id: bot.id,
    run_id: runId,
    dua_id: dua.id,
    event_key: event.key,
    event_title: event.title,
    event_url: event.url,
    event_published_at: event.publishedAt,
    source_type: event.sourceType,
    source_url: event.sourceUrl,
  })

  if (postError) throw new Error(postError.message)
  return true
}

async function runOneBot(bot: DuaBot): Promise<{ created: number; error: string | null }> {
  let runId: number | null = null
  let events: EventCandidate[] = []
  let warnings: string[] = []
  let created = 0

  try {
    const aiSettings = await fetchAiProviderSettings()
    runId = await createRun(bot.id, aiSettings)
    if (!isAiProviderReady(aiSettings)) {
      throw new Error("AI Provider is not configured. Enable a provider and save an API key under Admin → Integration → AI Provider before running dua bots.")
    }

    const discovery = await discoverEvents(bot)
    events = discovery.events
      .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
      .slice(0, MAX_EVENTS_PER_BOT)
    warnings = discovery.warnings

    if (events.length === 0) {
      const message = warnings.length > 0
        ? `No matching events found. Source warnings: ${warnings.join("; ")}`
        : "No matching recent events found from configured RSS/news sources."
      await finishRun(runId, "skipped", 0, 0, message)
      await updateBotRunState(bot, "skipped", message)
      return { created: 0, error: null }
    }

    for (const event of events) {
      if (await createDuaFromEvent(bot, runId, event, aiSettings)) created += 1
    }

    const status = created > 0 ? "success" : "skipped"
    const message = created > 0 ? (warnings.length > 0 ? `Source warnings: ${warnings.join("; ")}` : null) : "Matching events were already posted by this bot."
    await finishRun(runId, status, events.length, created, message)
    await updateBotRunState(bot, status, message)
    return { created, error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await finishRun(runId, "error", events.length, created, message)
    await updateBotRunState(bot, "error", message)
    return { created, error: message }
  }
}

function isDue(bot: DuaBot, manual: boolean): boolean {
  if (manual) return true
  if (bot.status !== "active") return false
  if (!bot.next_run_at) return true
  return new Date(bot.next_run_at).getTime() <= Date.now()
}

export async function runDueDuaBots(options: { botId?: number; manual?: boolean } = {}): Promise<BotRunnerResult> {
  const admin = createAdminSupabaseClient()
  let query = admin.from("dua_bots").select("*")
  if (options.botId) query = query.eq("id", options.botId)
  else query = query.eq("status", "active")

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const bots = ((data ?? []) as DuaBot[]).filter((bot) => isDue(bot, Boolean(options.manual)))
  const result: BotRunnerResult = { botsChecked: data?.length ?? 0, botsRun: 0, duasCreated: 0, errors: [] }

  for (const bot of bots) {
    result.botsRun += 1
    const run = await runOneBot(bot)
    result.duasCreated += run.created
    if (run.error) result.errors.push({ botId: bot.id, message: run.error })
  }

  return result
}

export async function runDueDuaEventBots(options: { botId?: number; manual?: boolean } = {}): Promise<BotRunnerResult> {
  return runDueDuaBots(options)
}
