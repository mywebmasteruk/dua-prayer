import { createHash } from "crypto"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import {
  callProviderChat,
  fetchAiProviderSettings,
  generateDuaForEvent,
  getAiProviderAdminView,
  isAiProviderReady,
  type AiProviderSettings,
  type ChatMessage,
} from "@/lib/ai-provider"
import { evaluateDuaModeration } from "@/lib/ai-moderation"
import { extractHashtags, normalizeHashtag } from "@/lib/hashtags"
import { curatedDuaCatalogue, DUA_LIBRARY } from "@/lib/dua-library"
import { detectLanguage, languageToCode } from "@/lib/detect-language"

export type BotStatus = "active" | "paused"
export type BotSourceType = "rss"
export type BotPublishMode = "pending" | "published"
export type BotRunStatus = "running" | "success" | "error" | "skipped"
export type BotLastStatus = "never_run" | Exclude<BotRunStatus, "running">

export type DuaBot = {
  id: number
  name: string
  description: string
  system_prompt: string | null
  status: BotStatus
  frequency_minutes: number
  max_duas_per_run: number
  source_type: BotSourceType
  rss_urls: string[]
  keywords: string[]
  categories: string[]
  tone: string
  language: string
  target_category_id: number | null
  auto_categorize: boolean
  web_search_enabled: boolean
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
  systemPrompt?: string
  system_prompt?: string | null
  status?: BotStatus
  sourceType?: BotSourceType
  rssUrls?: string | string[]
  sourceUrls?: string | string[]
  keywords?: string | string[]
  categories?: string | string[]
  eventCategories?: string | string[]
  frequencyMinutes?: number
  maxDuasPerRun?: number
  tone?: string
  language?: string
  targetCategoryId?: number | null
  autoCategorize?: boolean
  webSearchEnabled?: boolean
  publishMode?: BotPublishMode
}

export type NormalizedBotInput = {
  name: string
  description: string
  system_prompt: string | null
  status: BotStatus
  frequency_minutes: number
  max_duas_per_run: number
  source_type: BotSourceType
  rss_urls: string[]
  keywords: string[]
  categories: string[]
  tone: string
  language: string
  target_category_id: number | null
  auto_categorize: boolean
  web_search_enabled: boolean
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

type DuaBotPromptEvent = {
  title: string
  summary?: string | null
  url?: string | null
}

type EventDiscovery = {
  events: EventCandidate[]
  warnings: string[]
}

type EventSelection = {
  events: EventCandidate[]
  totalMatched: number
  skippedDuplicates: number
}

const MAX_EVENTS_PER_BOT = 3
const MAX_SOURCE_BYTES = 5_000_000
const REQUEST_TIMEOUT_MS = 15_000
const MAX_DUA_LENGTH = 280
// Freeform duas target ~220 chars (set in the prompt) but we allow more before
// trimming so a complete, slightly-longer dua isn't cut mid-sentence.
const FREEFORM_MAX_LENGTH = 400
const BOT_DUA_FORBIDDEN_CLOSING_WORDS = /\b(?:amen|ameen)\b[\s,.!?;:،۔]*/gi

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

function normalizeMaxDuasPerRun(value: number | undefined): number {
  const parsed = Number.isFinite(value) ? Math.trunc(value as number) : MAX_EVENTS_PER_BOT
  return Math.min(10, Math.max(1, parsed))
}

function nextRunDate(frequencyMinutes: number): string {
  return new Date(Date.now() + frequencyMinutes * 60_000).toISOString()
}

function sanitizeText(value: string | null | undefined, fallback = ""): string {
  return (value ?? fallback).replace(/\s+/g, " ").trim()
}

function sanitizeOptionalText(value: string | null | undefined): string | null {
  const sanitized = sanitizeText(value)
  return sanitized.length > 0 ? sanitized : null
}

export function sanitizeGeneratedBotDuaText(value: string): string {
  return sanitizeText(value.replace(BOT_DUA_FORBIDDEN_CLOSING_WORDS, ""))
}

function hashtagFromSeed(value: string): string {
  const words = value
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s_-]/gu, " ")
    .trim()
    .split(/[\s_-]+/)
    .filter((word) => word.length >= 2)
    .slice(0, 3)

  return normalizeHashtag(words.join("-"))
}

export function ensureGeneratedBotDuaHasHashtag(
  text: string,
  context: {
    keywords: string[]
    categories: string[]
    event: DuaBotPromptEvent
  },
): string {
  if (extractHashtags(text).length > 0) return text

  const candidates = [
    ...context.keywords,
    ...context.categories,
    context.event.title,
    context.event.summary ?? "",
  ]

  const tag = candidates.map(hashtagFromSeed).find(Boolean) ?? "duaprayer"
  const label = tag === "duaprayer" ? "#DuaPrayer" : `#${tag}`
  const combined = sanitizeText(`${text} ${label}`)
  return combined.length <= MAX_DUA_LENGTH ? combined : text
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

// A source URL can be an RSS/Atom feed or an ordinary web page. Feeds have an
// <rss>/<feed> root or <item>/<entry> blocks; anything else is treated as HTML.
function looksLikeFeed(text: string): boolean {
  const head = text.slice(0, 1000)
  if (/<(?:rss|feed)[\s>]/i.test(head)) return true
  return /<item[\s>]/i.test(text) || /<entry[\s>]/i.test(text)
}

function metaContent(html: string, key: string): string | null {
  const attrFirst = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]*\\bcontent=["']([^"']*)["']`,
    "i",
  )
  const contentFirst = new RegExp(
    `<meta[^>]+\\bcontent=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`,
    "i",
  )
  const match = attrFirst.exec(html) ?? contentFirst.exec(html)
  return match ? stripXml(match[1]) : null
}

const ARABIC_SCRIPT = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/

function isArabicLanguage(language: string): boolean {
  return /arab|عرب/i.test(language)
}

// Keep a dua body to a single script so English and Arabic bots never mix.
// Arabic bot → keep only lines containing Arabic script. English (any non-Arabic)
// bot → drop any line containing Arabic script (transliteration is handled by the
// prompt, since it's Latin and indistinguishable from English by script alone).
function enforceLanguageScript(body: string, language: string): string {
  const lines = body.split("\n")
  const kept = isArabicLanguage(language)
    ? lines.filter((l) => l.trim() === "" || ARABIC_SCRIPT.test(l))
    : lines.filter((l) => !ARABIC_SCRIPT.test(l))
  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim()
}

// Sanitize a model-provided hashtag and require it to match the dua's language
// (Arabic dua → Arabic-script tag, otherwise → non-Arabic tag). Returns "" if
// it can't be made into a valid, language-matching tag.
function normalizeLanguageHashtag(raw: string, language: string): string {
  const token = raw
    .trim()
    .replace(/^#+/, "")
    .replace(/\s+/g, "_")
    .replace(/[^\p{L}\p{N}_-]/gu, "")
    .slice(0, 40)
  if (token.length < 2) return ""
  const hasArabic = ARABIC_SCRIPT.test(token)
  if (isArabicLanguage(language) ? !hasArabic : hasArabic) return ""
  return `#${token}`
}

// Visible page text with scripts/styles/markup removed.
function extractReadableText(html: string): string {
  return stripXml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " "),
  )
}

// Treat a web page as a single event: its headline + readable body text. Dedupe
// is by title, so a static page posts once and re-posts only if its title changes.
function parseHtmlEvents(html: string, sourceUrl: string): EventCandidate[] {
  const title = metaContent(html, "og:title") ?? firstTag(html, "title") ?? firstTag(html, "h1")
  if (!title) return []
  const body = extractReadableText(html)
  const summary =
    body.length > 40
      ? body.slice(0, 4000)
      : (metaContent(html, "og:description") ?? metaContent(html, "description"))
  return [
    {
      key: eventKey(sourceUrl, title, sourceUrl),
      title,
      summary: summary || null,
      url: sourceUrl,
      publishedAt: null,
      sourceType: "rss" as const,
      sourceUrl,
    },
  ]
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
  const filters = bot.keywords.map((item) => item.toLowerCase())
  if (filters.length === 0) return true
  const haystack = `${event.title} ${event.summary ?? ""}`.toLowerCase()
  return filters.some((filter) => haystack.includes(filter))
}

export function selectUnpostedDuaBotEvents(events: EventCandidate[], postedKeys: ReadonlySet<string>, limit = MAX_EVENTS_PER_BOT): EventSelection {
  const sortedEvents = [...events].sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
  const unpostedEvents = sortedEvents.filter((event) => !postedKeys.has(event.key))

  return {
    events: unpostedEvents.slice(0, limit),
    totalMatched: sortedEvents.length,
    skippedDuplicates: sortedEvents.length - unpostedEvents.length,
  }
}

// Each card forces a STRUCTURALLY different dua. Weak models ignore abstract
// "be varied" instructions, so we pick one shape per event and demand it.
const DUA_STYLE_CARDS = [
  "SHAPE: very short and intense — one or two sentences only. Open with a Name of Allah (e.g. Ya Latif, Ya Rahman, Ya Hayyu, Ya Mujib), NOT with 'O Allah, You are…'. No list of disaster types.",
  "SHAPE: a single, unbroken flowing sentence in an intimate 'we turn to You…' / 'we come to You…' voice. Do not open by naming Allah; let remembrance arrive mid-sentence.",
  "SHAPE: begin with one short human reflection on the moment (no mention of Allah in the first clause), then move into the plea. Vary sentence lengths.",
  "SHAPE: open by invoking ONE attribute of Allah that fits this event (the Healer, the Provider, the Shelter of the homeless), then ask. Never use the phrase 'the Most Merciful'.",
  "SHAPE: start directly with the people or the need; bring praise/remembrance of Allah near the END, not the start. Keep it grounded and plain, not ornate.",
  "SHAPE: a quiet, two-part dua — first a line of gratitude or hope, then a line of supplication. Avoid the words 'grant', 'ease', 'bless' if you can find fresher verbs.",
]

function pickStyleCard(seed: string): string {
  const hash = createHash("sha256").update(seed).digest()
  return DUA_STYLE_CARDS[hash[0] % DUA_STYLE_CARDS.length]
}

export function buildDuaBotPromptMessages({
  userPrompt,
  systemPrompt,
  event,
  tone,
  language,
}: {
  userPrompt?: string | null
  systemPrompt?: string | null
  event: DuaBotPromptEvent
  tone: string
  language: string
}): ChatMessage[] {
  const botSystemPrompt = sanitizeOptionalText(systemPrompt)
  const botUserPrompt = sanitizeOptionalText(userPrompt)
  const styleCard = pickStyleCard(`${event.title}\n${event.summary ?? ""}`)

  return [
    {
      role: "system",
      content: [
        "You write concise, compassionate duas for a Muslim community platform.",
        "Duas must be strictly non-political and non-sectarian: never name or allude to governments, armed groups, parties, leaders, or 'political' framing, and never assign blame. Pray only for the people affected.",
        "No fabricated facts, casualty counts, locations, names, organizations, or religious rulings.",
        "Avoid graphic details and do not sensationalize suffering.",
        "Do not add a hashtag yourself — a relevant, safe hashtag is appended automatically.",
        "The dua must not include the words Amen or Ameen in any capitalization.",
        "CRITICAL — variety: never reuse a skeleton across duas. Do NOT open with 'O Allah, You are the Most Merciful' or any near-variant. Do NOT recite a list of disaster types (floods, earthquakes, storms, fire). Each dua must have a genuinely different structure, length, and rhythm.",
        "These examples show the RANGE of acceptable shapes — match their structural variety, never copy their wording:",
        '- "Ya Latif, be gentle with the ones whose night has no roof. Hold them close. #Shelter"',
        '- "We come to You with the weight of what the world is carrying — the frightened, the grieving, the ones digging through rubble for a name they love — and we ask only for Your mercy to reach them first. #Mercy"',
        '- "Homes are gone and still the children wait for morning. O Provider, send relief before despair does, and keep the helpers steady. #Relief"',
        "Return strict JSON only.",
        botSystemPrompt ? `Bot system prompt: ${botSystemPrompt}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    },
    {
      role: "user",
      content: [
        `Write one dua in ${language}.`,
        `Tone: ${tone}.`,
        botUserPrompt ? `User prompt: ${botUserPrompt}` : "",
        `For THIS dua, follow this shape exactly — ${styleCard}`,
        "Write ONLY the dua itself — no hashtag, no preamble, no surrounding quotation marks (a hashtag is added automatically).",
        "Keep it within 220 characters and ALWAYS finish on a complete sentence — never cut off mid-thought.",
        `Return JSON only: {"dua": string}.`,
        `Event title: ${JSON.stringify(event.title)}`,
        event.summary ? `Event summary: ${JSON.stringify(event.summary)}` : "",
        event.url ? `Event URL: ${JSON.stringify(event.url)}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ]
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
      headers: {
        Accept:
          "application/rss+xml, application/atom+xml, application/xml;q=0.9, text/html;q=0.9, */*;q=0.5",
        "User-Agent": "Mozilla/5.0 (compatible; DuaPrayerBot/1.0; +https://www.duaprayer.com)",
      },
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
    return { error: "Add at least one valid source URL (RSS/Atom feed or website page)." }
  }

  const tone = sanitizeText(input.tone, "compassionate")
  const language = sanitizeText(input.language, "English")
  const description = sanitizeText(input.description)
  const systemPrompt = sanitizeOptionalText(input.systemPrompt ?? input.system_prompt)

  return {
    value: {
      name,
      description,
      system_prompt: systemPrompt,
      status: input.status === "active" ? "active" : "paused",
      frequency_minutes: normalizeFrequency(input.frequencyMinutes),
      max_duas_per_run: normalizeMaxDuasPerRun(input.maxDuasPerRun),
      source_type: sourceType,
      rss_urls: rssUrls,
      keywords: normalizeList(input.keywords),
      categories: normalizeList(input.categories ?? input.eventCategories),
      tone: tone.slice(0, 80),
      language: language.slice(0, 80),
      target_category_id: input.autoCategorize ? null : input.targetCategoryId ?? null,
      auto_categorize: input.autoCategorize ?? false,
      web_search_enabled: input.webSearchEnabled ?? false,
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
      ? "Bots can generate duas from configured sources (RSS/Atom feeds or website pages)."
      : "Configure and enable Admin → Integration → AI Provider before bot runs can create duas.",
  }
}

// Pull events from every configured source — RSS/Atom feeds yield many items,
// ordinary web pages yield one (headline + description).
async function discoverSourceEvents(bot: DuaBot): Promise<EventDiscovery> {
  const events: EventCandidate[] = []
  const warnings: string[] = []

  for (const sourceUrl of bot.rss_urls) {
    try {
      const content = await fetchWithTimeout(sourceUrl)
      const parsed = looksLikeFeed(content)
        ? parseRssEvents(content, sourceUrl)
        : parseHtmlEvents(content, sourceUrl)
      // In "retrieve" mode the source pages are hand-picked dua collections, so
      // every page is eligible (keywords act as a theme preference in the prompt
      // instead of a hard filter). Other engines filter events by keyword.
      events.push(...(DUA_BOT_ENGINE === "retrieve" ? parsed : parsed.filter((event) => matchesBot(bot, event))))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      warnings.push(`${sourceUrl}: ${message}`)
      console.warn("Dua bot source fetch failed", { botId: bot.id, sourceUrl, error })
    }
  }

  return { events, warnings }
}

async function discoverEvents(bot: DuaBot): Promise<EventDiscovery> {
  return discoverSourceEvents(bot)
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

async function getPostedEventKeys(botId: number, keys: string[]): Promise<Set<string>> {
  const uniqueKeys = [...new Set(keys)]
  if (uniqueKeys.length === 0) return new Set()

  const admin = createAdminSupabaseClient()
  const { data, error } = await admin
    .from("dua_bot_event_posts")
    .select("event_key")
    .eq("bot_id", botId)
    .in("event_key", uniqueKeys)

  if (error) {
    console.error("Error checking bot event dedupe:", error)
    return new Set(uniqueKeys)
  }

  return new Set((data ?? []).map((row) => row.event_key as string))
}

async function alreadyPosted(botId: number, key: string): Promise<boolean> {
  const postedKeys = await getPostedEventKeys(botId, [key])
  return postedKeys.has(key)
}

const CURATED_MAX_LENGTH = 1180
const SEARCH_TIMEOUT_MS = 8_000

// Which dua-composition engine the bot uses.
//   "retrieve"  — ACTIVE: extract a well-known dua VERBATIM from the source page
//                 text (for dua-collection sites). Does not compose or adapt.
//   "freeform"  — original plan: the model composes a dua from the news context.
//                 Best paired with a premium model (set in Admin → AI Provider).
//   "curated"   — "DuaBotSystem2": web-search / curated-library authentic dua,
//                 adapted to the news. Kept intact so we can switch back here.
// Flip this single value to switch systems.
const DUA_BOT_ENGINE: "freeform" | "curated" | "retrieve" = "retrieve"

type TavilyResult = { title: string; content: string; url: string }

// Live web search for authentic duas. Uses the free Tavily tier when
// TAVILY_API_KEY is set; returns [] when the key is absent, the quota is spent,
// or the request fails. Each result keeps its own source URL so the dua we post
// can be attributed to (and linked back to) the exact page it came from.
async function searchAuthenticDuaResults(query: string): Promise<TavilyResult[]> {
  const key = process.env.TAVILY_API_KEY?.trim()
  if (!key) return []

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS)
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: key, query, max_results: 5, search_depth: "basic", include_raw_content: true }),
      signal: controller.signal,
    })
    if (!res.ok) return []
    const data = (await res.json()) as { results?: Array<{ title?: string; content?: string; raw_content?: string; url?: string }> }
    return (data.results ?? [])
      .map((r) => ({
        title: (r.title ?? "").trim(),
        content: ((r.raw_content || r.content) ?? "").trim().slice(0, 4000),
        url: (r.url ?? "").trim(),
      }))
      .filter((r) => r.content.length > 0 && r.url.length > 0)
      .slice(0, 5)
  } catch {
    return []
  } finally {
    clearTimeout(timeout)
  }
}

// String form used by the curated engine (it adapts from a combined corpus and
// does not need per-result attribution).
async function searchAuthenticDuaSources(event: EventCandidate): Promise<string[]> {
  const query = `authentic Islamic dua (supplication) from the Quran or an authentic hadith relevant to: ${event.title}`
  const results = await searchAuthenticDuaResults(query)
  return results
    .map((r) => [r.title, r.content, r.url ? `(source: ${r.url})` : ""].filter(Boolean).join(" ").trim())
    .filter(Boolean)
}

// Strip forbidden closing words and tidy whitespace WITHOUT collapsing the line
// breaks that separate the dua, source, and hashtag.
function cleanMultilineDua(value: string): string {
  return value
    .replace(BOT_DUA_FORBIDDEN_CLOSING_WORDS, "")
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

const HASHTAG_STOPWORDS = new Set([
  "the", "and", "for", "with", "from", "that", "this", "after", "amid", "over", "into",
  "their", "under", "says", "say", "new", "over", "have", "has", "will", "amid", "near",
  "more", "than", "what", "when", "where", "which", "while", "about", "your", "our",
])

// Turn a word or phrase into a single PascalCase tag token ("flood relief" → "FloodRelief").
function makeTag(phrase: string): string {
  return phrase
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("")
}

function distinctiveTitleWords(title: string): string[] {
  return title
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4 && !HASHTAG_STOPWORDS.has(w.toLowerCase()))
}

// Ordered hashtag candidates. EVERY candidate is a two-word CamelCase compound
// (e.g. #ForgivenessDua) — single-word tags are not allowed. Curated, safe theme
// words come first; raw headline words are a last resort (can be proper nouns or
// politically charged).
const HASHTAG_SUFFIXES = ["Dua", "Duas", "Prayer", "Supplication", "Mercy", "Hope", "Faith", "Relief"]

function buildHashtagCandidates(bot: DuaBot, event: EventCandidate): string[] {
  const themed = bot.keywords.map(makeTag).filter(Boolean)
  const titleWords = distinctiveTitleWords(event.title).map(makeTag).filter(Boolean)

  // Skip pairs where the word and suffix overlap (e.g. "Duas"+"Dua" → "DuasDua").
  const overlaps = (a: string, b: string) => {
    const la = a.toLowerCase()
    const lb = b.toLowerCase()
    return la.startsWith(lb) || lb.startsWith(la)
  }
  const candidates: string[] = []
  // Theme word + suffix → #LoveDua, #MercyPrayer …
  for (const t of themed) for (const s of HASHTAG_SUFFIXES) if (!overlaps(t, s)) candidates.push(`${t}${s}`)
  // Headline word + suffix → #ForgivenessDua …
  for (const t of titleWords) for (const s of HASHTAG_SUFFIXES) if (!overlaps(t, s)) candidates.push(`${t}${s}`)
  // Consecutive headline words → #PowerfulDua (from "Powerful Dua") …
  for (let i = 0; i + 1 < titleWords.length; i += 1) candidates.push(`${titleWords[i]}${titleWords[i + 1]}`)
  candidates.push("DuaPrayer")

  const seen = new Set<string>()
  const ordered: string[] = []
  for (const candidate of candidates) {
    const norm = normalizeHashtag(candidate)
    if (!norm || seen.has(norm)) continue
    seen.add(norm)
    ordered.push(candidate)
  }
  return ordered
}

// Pick the first candidate whose normalized tag hasn't been used; record it so
// no two duas (this run or recent history) share a hashtag.
function pickUniqueHashtag(bot: DuaBot, event: EventCandidate, usedTags: Set<string>): string {
  const candidates = buildHashtagCandidates(bot, event)
  for (const candidate of candidates) {
    const norm = normalizeHashtag(candidate)
    if (norm && !usedTags.has(norm)) {
      usedTags.add(norm)
      return `#${candidate}`
    }
  }
  const base = candidates[0] ?? "DuaPrayer"
  let n = 2
  while (usedTags.has(normalizeHashtag(`${base}${n}`))) n += 1
  const chosen = `${base}${n}`
  usedTags.add(normalizeHashtag(chosen))
  return `#${chosen}`
}

async function getRecentHashtagSet(limit = 200): Promise<Set<string>> {
  try {
    const admin = createAdminSupabaseClient()
    const { data } = await admin.from("duas").select("text").order("created_at", { ascending: false }).limit(limit)
    const used = new Set<string>()
    for (const row of data ?? []) {
      for (const tag of extractHashtags(row.text as string)) used.add(tag.tag)
    }
    return used
  } catch {
    return new Set<string>()
  }
}

// Find an authentic dua (web search, else curated library) and adapt it to the
// event in the bot's language. Returns null when nothing usable is produced.
async function composeAdaptedDuaForEvent(
  bot: DuaBot,
  event: EventCandidate,
  settings: AiProviderSettings,
  usedTags: Set<string>,
): Promise<string | null> {
  const language = bot.language?.trim() || "English"
  const snippets = await searchAuthenticDuaSources(event)
  const corpus = snippets.length > 0
    ? snippets.map((s, i) => `[${i + 1}] ${s}`).join("\n\n")
    : curatedDuaCatalogue()

  const system = [
    "You compose one heartfelt dua (Islamic supplication) for a Muslim community feed, grounded in an AUTHENTIC source.",
    "You are given candidate authentic supplications (from the Qur'an or hadith, or web snippets that quote them). Choose the most relevant and adapt it naturally to the situation in the news.",
    "Stay faithful to the meaning and spirit of the source. Never invent Qur'anic verses or hadith, never claim events are divine punishment, and add no politics, fabricated facts, names, or casualty figures.",
    `Write the dua in ${language}.`,
    "Vary the structure, length, and opening run-to-run; never open with 'O Allah, You are the Most Merciful' or recite a list of disaster types. Do not use the words Amen or Ameen.",
    "Name the source you adapted from (e.g. 'Qur'an 21:87', 'Sahih Muslim', or a site name) in the `source` field.",
    'Return strict JSON only: {"dua": string, "source": string}.',
  ].join("\n")

  const user = [
    `News title: ${JSON.stringify(event.title)}`,
    event.summary ? `News summary: ${JSON.stringify(event.summary)}` : "",
    bot.description ? `Bot focus: ${bot.description}` : "",
    bot.system_prompt ? `Style guidance: ${bot.system_prompt}` : "",
    "Candidate authentic supplications:",
    corpus,
  ]
    .filter(Boolean)
    .join("\n")

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), settings.requestTimeoutMs)
  let raw: string
  try {
    raw = await callProviderChat(
      settings,
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      controller.signal,
    )
  } finally {
    clearTimeout(timeout)
  }

  let parsed: { dua?: unknown; source?: unknown }
  try {
    parsed = JSON.parse(raw) as { dua?: unknown; source?: unknown }
  } catch {
    throw new Error(`Adapted dua: model returned invalid JSON for event: ${event.title.slice(0, 60)}`)
  }

  // Drop any hashtags the model added — we assign one unique tag per dua.
  const rawBody = (typeof parsed.dua === "string" ? parsed.dua : "").replace(
    /(^|[^\p{L}\p{N}_])#[\p{L}\p{N}][\p{L}\p{N}_-]*/gu,
    "$1",
  )
  const body = cleanMultilineDua(rawBody)
  if (body.length < 15) return null
  const source = typeof parsed.source === "string" ? sanitizeText(parsed.source).slice(0, 120) : ""

  const hashtag = pickUniqueHashtag(bot, event, usedTags)
  let text = source ? `${body}\n\n— ${source} ${hashtag}` : `${body} ${hashtag}`
  if (text.length > CURATED_MAX_LENGTH) {
    text = text.slice(0, CURATED_MAX_LENGTH).replace(/\s+\S*$/, "").trim()
  }
  return text
}

// Original plan: the model composes a dua directly from the news context
// (variety prompt + style cards). Designed for a capable/premium model.
async function composeFreeformDuaForEvent(
  bot: DuaBot,
  event: EventCandidate,
  settings: AiProviderSettings,
  usedTags: Set<string>,
): Promise<string | null> {
  const generated = await generateDuaForEvent({
    eventTitle: event.title,
    eventSummary: event.summary,
    eventUrl: event.url,
    tone: bot.tone,
    language: bot.language,
    messages: buildDuaBotPromptMessages({
      userPrompt: bot.description,
      systemPrompt: bot.system_prompt,
      event,
      tone: bot.tone,
      language: bot.language,
    }),
    settings,
  })

  // Strip any hashtags the model wrote — we assign one unique tag per dua.
  const stripped = sanitizeGeneratedBotDuaText(generated).replace(
    /(^|[^\p{L}\p{N}_])#[\p{L}\p{N}][\p{L}\p{N}_-]*/gu,
    "$1",
  )
  const body = sanitizeText(stripped)
  if (body.length < 15) return null

  const hashtag = pickUniqueHashtag(bot, event, usedTags)
  const maxBody = FREEFORM_MAX_LENGTH - hashtag.length - 1
  let trimmedBody = body
  if (body.length > maxBody) {
    const slice = body.slice(0, maxBody)
    // Prefer ending on a complete sentence, else a clause (comma), else a word.
    const sentence = slice.match(/^[\s\S]*[.!?]["')\]]?/)
    const clause = slice.match(/^[\s\S]*,/)
    trimmedBody = (sentence?.[0] ?? clause?.[0]?.replace(/,\s*$/, ".") ?? slice.replace(/\s+\S*$/, "")).trim()
  }
  if (trimmedBody.length < 15) return null
  return `${trimmedBody} ${hashtag}`
}

// Extract a well-known dua VERBATIM from a source page's text. No composing,
// no adapting, no translating — the dua is copied exactly as it appears.
async function composeRetrievedDuaForEvent(
  bot: DuaBot,
  event: EventCandidate,
  settings: AiProviderSettings,
  usedTags: Set<string>,
): Promise<string | null> {
  const pageText = event.summary?.trim()
  if (!pageText || pageText.length < 40) return null

  const language = bot.language?.trim() || "English"
  const arabic = isArabicLanguage(language)
  const languageRule = arabic
    ? "OUTPUT LANGUAGE: Arabic ONLY. Return just the Arabic script of the dua. Do NOT include any transliteration (romanized text) or English translation."
    : `OUTPUT LANGUAGE: ${language} ONLY. Return just the ${language} translation/meaning of the dua. Do NOT include Arabic script, and do NOT include romanized transliteration (e.g. 'Allahumma inni…'). Plain ${language} sentences only.`
  const tagExample = arabic ? "#دعاء_الرحمة" : "#Mercy_Dua"
  const system = [
    "You extract ONE complete, well-known dua (Islamic supplication) from the provided web-page text.",
    "Copy the chosen-language text VERBATIM from the page — do not paraphrase, summarize, add, or remove words. If the page shows multiple language versions, take only the one for the required output language, exactly as written.",
    languageRule,
    "Pick a complete, self-contained dua (not a heading, fragment, or commentary). Prefer a widely-known authentic one.",
    bot.keywords.length > 0
      ? `Prefer a dua whose theme relates to: ${bot.keywords.join(", ")} — but any complete, well-known dua on the page is acceptable.`
      : "",
    "The `dua` field must contain ONLY the dua text — no source, reference, citation, transliteration, hashtag, or any other text.",
    "Exclude navigation text, ads, author commentary, and the words Amen/Ameen.",
    `The \`hashtag\` field: ONE context-relevant hashtag of two meaningful words in ${language}, joined by an underscore, prefixed with # (e.g. ${tagExample}). It must be written in ${arabic ? "Arabic script" : language}, matching the dua's language.`,
    'Return strict JSON only: {"dua": string, "hashtag": string}. If the page has no complete dua in the required language, return {"dua": "", "hashtag": ""}.',
    bot.system_prompt ? `Extra instruction: ${bot.system_prompt}` : "",
  ]
    .filter(Boolean)
    .join("\n")
  const user = [
    `Page title: ${JSON.stringify(event.title)}`,
    event.url ? `Page URL: ${event.url}` : "",
    "Page content:",
    pageText,
  ]
    .filter(Boolean)
    .join("\n")

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), settings.requestTimeoutMs)
  let raw: string
  try {
    raw = await callProviderChat(
      settings,
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      controller.signal,
    )
  } finally {
    clearTimeout(timeout)
  }

  let parsed: { dua?: unknown; hashtag?: unknown }
  try {
    parsed = JSON.parse(raw) as { dua?: unknown; hashtag?: unknown }
  } catch {
    throw new Error(`Retrieved dua: model returned invalid JSON for page: ${event.title.slice(0, 60)}`)
  }

  // Strip any inline hashtags the model/page included — the dua text stays clean
  // and we append a single hashtag (in the dua's language) separately.
  const stripHashtags = (s: string) => s.replace(/(^|[^\p{L}\p{N}_])#[\p{L}\p{N}][\p{L}\p{N}_-]*/gu, "$1")
  // Enforce a single script so languages never mix (safety net over the prompt).
  const body = enforceLanguageScript(
    cleanMultilineDua(stripHashtags(typeof parsed.dua === "string" ? parsed.dua : "")),
    language,
  )
  if (body.length < 15) return null

  // Bot-provided hashtag, in the dua's language. No source or other appended text.
  const hashtag = normalizeLanguageHashtag(typeof parsed.hashtag === "string" ? parsed.hashtag : "", language)
  let text = hashtag ? `${body}\n\n${hashtag}` : body
  if (text.length > CURATED_MAX_LENGTH) {
    text = text.slice(0, CURATED_MAX_LENGTH).replace(/\s+\S*$/, "").trim()
  }
  return text
}

// When a bot is set to auto-categorise, ask the model to place the dua into the
// best-fitting official topic category (channel_type = "category"). Returns the
// chosen category id, or null when none fits / the model can't decide.
async function pickCategoryForDua(
  dua: string,
  event: EventCandidate,
  settings: AiProviderSettings,
): Promise<number | null> {
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin
    .from("categories")
    .select("id, name, description")
    .eq("channel_type", "category")
    .eq("is_active", true)
    .eq("status", "approved")
    .order("sort_order", { ascending: true })

  if (error || !data || data.length === 0) return null
  const validIds = new Set(data.map((category) => category.id))

  const system = [
    "You assign an Islamic dua (supplication) to the single best-fitting category from a fixed list.",
    "Choose the category whose theme most closely matches the dua and its source event.",
    'Return strict JSON only: {"categoryId": number | null}. Use null only if no category is a reasonable fit.',
  ].join("\n")
  const user = [
    "Categories:",
    data.map((category) => `- id ${category.id}: ${category.name}${category.description ? ` — ${category.description}` : ""}`).join("\n"),
    "",
    `Event title: ${JSON.stringify(event.title)}`,
    "Dua:",
    dua,
  ].join("\n")

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), settings.requestTimeoutMs)
  let raw: string
  try {
    raw = await callProviderChat(
      settings,
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      controller.signal,
    )
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }

  try {
    const parsed = JSON.parse(raw) as { categoryId?: unknown }
    const id = typeof parsed.categoryId === "number" ? parsed.categoryId : null
    return id !== null && validIds.has(id) ? id : null
  } catch {
    return null
  }
}

// Rotating themes for the exhaustion fallback. When a bot's static sources have
// nothing new, we web-search (then fall back to the local library) for an
// authentic dua on the next theme in rotation so the feed keeps moving.
const FALLBACK_DUA_THEMES = [
  "forgiveness and repentance",
  "healing and good health",
  "relief from anxiety and grief",
  "gratitude and thankfulness to Allah",
  "guidance and steadfastness on the straight path",
  "lawful provision (rizq) and barakah",
  "protection from harm and evil",
  "patience in hardship",
  "mercy for parents",
  "beneficial knowledge",
  "ease in difficulty",
  "a good end and a good death",
  "increase in faith (iman)",
  "entering Paradise and refuge from the Fire",
  "success and the best of this life and the next",
  "trust in Allah (tawakkul)",
  "the wellbeing of the Muslim ummah",
  "contentment and a peaceful heart",
]

// How many fallback duas this bot has already posted — used to rotate themes and
// library entries deterministically so consecutive runs don't repeat.
async function countFallbackPosts(botId: number): Promise<number> {
  try {
    const admin = createAdminSupabaseClient()
    const { count } = await admin
      .from("dua_bot_event_posts")
      .select("id", { count: "exact", head: true })
      .eq("bot_id", botId)
      .in("source_url", ["search:tavily", "library:fallback"])
    return count ?? 0
  } catch {
    return 0
  }
}

// Where a fallback dua came from, so the run log can name (and link to) the source.
type FallbackResult = { posted: boolean; sourceLabel: string | null; sourceUrl: string | null }

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

// Sources exhausted → post an authentic dua anyway. First try a live web search
// (Tavily) and extract a dua VERBATIM via the retrieve engine, attributing it to
// the exact page it came from; if that yields nothing usable, fall back to the
// verbatim local library.
async function createFallbackDua(
  bot: DuaBot,
  runId: number | null,
  aiSettings: AiProviderSettings,
  usedTags: Set<string>,
): Promise<FallbackResult> {
  const rotation = await countFallbackPosts(bot.id)
  const theme = FALLBACK_DUA_THEMES[rotation % FALLBACK_DUA_THEMES.length]

  // 1) Web search → verbatim extraction, one result page at a time so the dua we
  //    keep is tied to the precise URL it was extracted from.
  const query = `authentic Islamic dua (supplication) from the Quran or an authentic hadith relevant to: ${theme}`
  const results = await searchAuthenticDuaResults(query)
  for (const result of results) {
    const searchEvent: EventCandidate = {
      key: `fallback:search:${bot.id}:${Date.now()}`,
      title: result.title || `Authentic dua: ${theme}`,
      summary: `${result.title}\n${result.content}`.trim(),
      url: result.url,
      publishedAt: null,
      sourceType: "rss",
      sourceUrl: "search:tavily",
    }
    try {
      if (await createDuaFromEvent(bot, runId, searchEvent, aiSettings, usedTags)) {
        return { posted: true, sourceLabel: result.title || hostnameOf(result.url), sourceUrl: result.url }
      }
    } catch (error) {
      console.warn("Dua bot fallback web search failed", { botId: bot.id, url: result.url, error: error instanceof Error ? error.message : String(error) })
    }
  }

  // 2) Local library fallback — verbatim, no AI call (works even with no credits).
  return createLibraryFallbackDua(bot, runId, rotation, aiSettings)
}

async function createLibraryFallbackDua(
  bot: DuaBot,
  runId: number | null,
  rotation: number,
  aiSettings: AiProviderSettings,
): Promise<FallbackResult> {
  const none: FallbackResult = { posted: false, sourceLabel: null, sourceUrl: null }
  if (DUA_LIBRARY.length === 0) return none
  const language = bot.language?.trim() || "English"
  const arabic = isArabicLanguage(language)
  const entry = DUA_LIBRARY[rotation % DUA_LIBRARY.length]
  const body = (arabic ? entry.arabic : entry.translation)?.trim()
  if (!body || body.length < 5) return none

  const themeWord = entry.themes[0] ?? "dua"
  const rawTag = arabic
    ? "#دعاء_مأثور"
    : `#${themeWord.charAt(0).toUpperCase()}${themeWord.slice(1)}_Dua`
  const hashtag = normalizeLanguageHashtag(rawTag, language)
  let text = hashtag ? `${body}\n\n${hashtag}` : body
  if (text.length > CURATED_MAX_LENGTH) {
    text = text.slice(0, CURATED_MAX_LENGTH).replace(/\s+\S*$/, "").trim()
  }

  const event: EventCandidate = {
    key: `fallback:library:${bot.id}:${entry.id}:${Date.now()}`,
    title: `Authentic dua (${entry.source})`,
    summary: null,
    url: null,
    publishedAt: null,
    sourceType: "rss",
    sourceUrl: "library:fallback",
  }
  const posted = await persistDuaFromEvent(bot, runId, event, text, aiSettings)
  return { posted, sourceLabel: posted ? `local library (${entry.source})` : null, sourceUrl: null }
}

async function createDuaFromEvent(
  bot: DuaBot,
  runId: number | null,
  event: EventCandidate,
  aiSettings: AiProviderSettings,
  usedTags: Set<string>,
): Promise<boolean> {
  if (await alreadyPosted(bot.id, event.key)) return false

  const text = DUA_BOT_ENGINE === "curated"
    ? await composeAdaptedDuaForEvent(bot, event, aiSettings, usedTags)
    : DUA_BOT_ENGINE === "retrieve"
      ? await composeRetrievedDuaForEvent(bot, event, aiSettings, usedTags)
      : await composeFreeformDuaForEvent(bot, event, aiSettings, usedTags)
  if (!text) {
    // No usable dua could be produced for this event — skip it.
    return false
  }

  return persistDuaFromEvent(bot, runId, event, text, aiSettings)
}

// Moderate, categorise, insert the dua, and record the source event. Shared by
// the engine path (createDuaFromEvent) and the exhaustion fallback below.
async function persistDuaFromEvent(
  bot: DuaBot,
  runId: number | null,
  event: EventCandidate,
  text: string,
  aiSettings: AiProviderSettings,
): Promise<boolean> {
  const moderation = await evaluateDuaModeration({ text, settings: aiSettings })
  if (moderation.severity === "block") {
    throw new Error(`Generated dua blocked by moderation: ${moderation.reason}`)
  }

  const categoryId = bot.auto_categorize
    ? await pickCategoryForDua(text, event, aiSettings)
    : bot.target_category_id

  const requiresReview = bot.publish_mode === "pending" || moderation.flagged || moderation.severity === "review"
  const admin = createAdminSupabaseClient()
  const { data: dua, error: duaError } = await admin
    .from("duas")
    .insert({
      text,
      category_id: categoryId,
      published: !requiresReview,
      flagged: requiresReview,
      user_id: null,
      language: languageToCode(bot.language) ?? detectLanguage(text),
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
    const matchedEvents = discovery.events
    warnings = discovery.warnings

    const usedTags = await getRecentHashtagSet()

    let selection: EventSelection = { events: [], totalMatched: 0, skippedDuplicates: 0 }
    if (matchedEvents.length > 0) {
      const postedKeys = await getPostedEventKeys(bot.id, matchedEvents.map((event) => event.key))
      selection = selectUnpostedDuaBotEvents(matchedEvents, postedKeys, normalizeMaxDuasPerRun(bot.max_duas_per_run))
    }
    events = selection.events

    const eventErrors: string[] = []
    for (const event of events) {
      try {
        if (await createDuaFromEvent(bot, runId, event, aiSettings, usedTags)) created += 1
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        eventErrors.push(message)
        console.warn("Dua bot event failed", { botId: bot.id, eventKey: event.key, error: message })
      }
    }

    // The static sources produced nothing this run (no matches, all already
    // posted, or the only new event failed extraction). If the bot opts into web
    // search, post an authentic dua via web search (Tavily) or the local library
    // so the feed keeps moving; otherwise it just skips (sources only).
    let fallback: FallbackResult | null = null
    if (created === 0 && bot.web_search_enabled) {
      try {
        const result = await createFallbackDua(bot, runId, aiSettings, usedTags)
        if (result.posted) {
          created += 1
          fallback = result
        }
      } catch (error) {
        eventErrors.push(`Fallback error: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    if (eventErrors.length > 0) warnings.push(...eventErrors.map((err) => err.startsWith("Fallback") ? err : `Event error: ${err}`))

    const status = created > 0 ? "success" : eventErrors.length > 0 ? "error" : "skipped"
    const warningSuffix = warnings.length > 0 ? ` Warnings: ${warnings.join("; ")}` : ""
    const sourceNote = `${selection.totalMatched} matched, ${selection.skippedDuplicates} duplicate(s) skipped.`
    const fallbackVia = fallback
      ? (fallback.sourceUrl
        ? `web search — found at ${fallback.sourceUrl}`
        : `fallback (${fallback.sourceLabel ?? "local library"})`)
      : null
    const message = created > 0
      ? (fallback
        ? `Posted 1 authentic dua via ${fallbackVia} (sources exhausted: ${sourceNote})${warningSuffix}`
        : `Created ${created}. ${sourceNote}${warningSuffix}`)
      : eventErrors.length > 0
        ? `No duas created — every attempt failed. ${sourceNote}${warningSuffix}`
        : `No new duas. ${sourceNote}${warningSuffix}`
    await finishRun(runId, status, selection.totalMatched, created, message)
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
