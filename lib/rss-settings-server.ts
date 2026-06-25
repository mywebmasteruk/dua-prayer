import { unstable_cache } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { isMissingTableError } from "@/lib/db-errors"
import { SITE_SETTING_KEYS } from "@/lib/settings-keys"

export type RssSettings = {
  enabled: boolean
  title: string
  description: string
  author: string
  copyright: string
  /** ISO 639-1 code (e.g. "en", "ar"). */
  language: string
  /** Cache hint for aggregators, in minutes. */
  ttlMinutes: number
  /** Max items in the feed (1–50). */
  itemCount: number
  includeChannelPosts: boolean
  includeFreeformDuas: boolean
  /** Channel IDs (UUIDs) to exclude when channel posts are included. */
  excludedChannelIds: string[]
  /** When true, only verified channels appear in the feed. */
  onlyVerifiedChannels: boolean
}

export const RSS_DEFAULTS: RssSettings = {
  enabled: false,
  title: "",
  description: "",
  author: "",
  copyright: "",
  language: "en",
  ttlMinutes: 10,
  itemCount: 20,
  includeChannelPosts: true,
  includeFreeformDuas: true,
  excludedChannelIds: [],
  onlyVerifiedChannels: false,
}

const RSS_KEYS = [
  SITE_SETTING_KEYS.rssEnabled,
  SITE_SETTING_KEYS.rssTitle,
  SITE_SETTING_KEYS.rssDescription,
  SITE_SETTING_KEYS.rssAuthor,
  SITE_SETTING_KEYS.rssCopyright,
  SITE_SETTING_KEYS.rssLanguage,
  SITE_SETTING_KEYS.rssTtlMinutes,
  SITE_SETTING_KEYS.rssItemCount,
  SITE_SETTING_KEYS.rssIncludeChannelPosts,
  SITE_SETTING_KEYS.rssIncludeFreeformDuas,
  SITE_SETTING_KEYS.rssExcludedChannelIds,
  SITE_SETTING_KEYS.rssOnlyVerifiedChannels,
] as const

function parseBool(value: string | null | undefined, fallback: boolean): boolean {
  if (value == null) return fallback
  const v = value.trim().toLowerCase()
  if (v === "true" || v === "1" || v === "yes") return true
  if (v === "false" || v === "0" || v === "no") return false
  return fallback
}

function parseInt32(value: string | null | undefined, fallback: number, min: number, max: number): number {
  if (value == null) return fallback
  const n = Number.parseInt(value, 10)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

function parseStringArray(value: string | null | undefined): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed.filter((v): v is string => typeof v === "string")
  } catch {
    // Not JSON — fall through to default empty list.
  }
  return []
}

async function fetchRssSettings(): Promise<RssSettings> {
  let supabase
  try {
    supabase = createAdminSupabaseClient()
  } catch (error) {
    console.error("RSS settings: missing Supabase credentials", error)
    return { ...RSS_DEFAULTS }
  }

  const { data, error } = await supabase.from("site_settings").select("key, value").in("key", RSS_KEYS)

  if (error) {
    if (!isMissingTableError(error)) {
      console.error("Error fetching RSS settings:", error)
    }
    return { ...RSS_DEFAULTS }
  }

  const byKey = new Map((data ?? []).map((row) => [row.key, (row.value as string | null) ?? ""]))
  return {
    enabled: parseBool(byKey.get(SITE_SETTING_KEYS.rssEnabled), RSS_DEFAULTS.enabled),
    title: (byKey.get(SITE_SETTING_KEYS.rssTitle) ?? "").trim() || RSS_DEFAULTS.title,
    description: (byKey.get(SITE_SETTING_KEYS.rssDescription) ?? "").trim() || RSS_DEFAULTS.description,
    author: (byKey.get(SITE_SETTING_KEYS.rssAuthor) ?? "").trim() || RSS_DEFAULTS.author,
    copyright: (byKey.get(SITE_SETTING_KEYS.rssCopyright) ?? "").trim() || RSS_DEFAULTS.copyright,
    language: (byKey.get(SITE_SETTING_KEYS.rssLanguage) ?? "").trim() || RSS_DEFAULTS.language,
    ttlMinutes: parseInt32(byKey.get(SITE_SETTING_KEYS.rssTtlMinutes), RSS_DEFAULTS.ttlMinutes, 1, 1440),
    itemCount: parseInt32(byKey.get(SITE_SETTING_KEYS.rssItemCount), RSS_DEFAULTS.itemCount, 1, 50),
    includeChannelPosts: parseBool(byKey.get(SITE_SETTING_KEYS.rssIncludeChannelPosts), RSS_DEFAULTS.includeChannelPosts),
    includeFreeformDuas: parseBool(byKey.get(SITE_SETTING_KEYS.rssIncludeFreeformDuas), RSS_DEFAULTS.includeFreeformDuas),
    excludedChannelIds: parseStringArray(byKey.get(SITE_SETTING_KEYS.rssExcludedChannelIds)),
    onlyVerifiedChannels: parseBool(byKey.get(SITE_SETTING_KEYS.rssOnlyVerifiedChannels), RSS_DEFAULTS.onlyVerifiedChannels),
  }
}

const getRssSettingsCached = unstable_cache(fetchRssSettings, ["site-setting-rss"], {
  revalidate: 300,
  tags: ["site-setting-rss"],
})

export async function getRssSettings(): Promise<RssSettings> {
  return getRssSettingsCached()
}

/** Uncached read for the admin form — caller must enforce RBAC. */
export async function getRssSettingsForAdminRead(): Promise<RssSettings> {
  return fetchRssSettings()
}
