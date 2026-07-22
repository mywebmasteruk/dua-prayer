"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { requirePermission } from "@/lib/auth"
import { SITE_SETTING_KEYS } from "@/lib/settings-keys"
import { getRssSettingsForAdminRead, RSS_DEFAULTS, type RssSettings } from "@/lib/rss-settings-server"

export async function getRssSettingsForAdmin(): Promise<RssSettings> {
  const gate = await requirePermission("manage_settings")
  if (!gate.ok) return { ...RSS_DEFAULTS }
  return getRssSettingsForAdminRead()
}

function clampInt(value: number, fallback: number, min: number, max: number): number {
  const n = Number.isFinite(value) ? Math.trunc(value) : fallback
  return Math.min(max, Math.max(min, n))
}

function sanitizeLanguage(value: string): string {
  const trimmed = value.trim().toLowerCase()
  // RSS expects an RFC 1766 language code (e.g. "en", "en-gb").
  if (!/^[a-z]{2}(-[a-z]{2})?$/.test(trimmed)) return RSS_DEFAULTS.language
  return trimmed
}

function sanitizeChannelIds(values: string[]): string[] {
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const out = new Set<string>()
  for (const v of values) {
    const trimmed = v.trim()
    if (uuidRe.test(trimmed)) out.add(trimmed)
  }
  return Array.from(out)
}

export async function saveRssSettings(input: RssSettings) {
  const gate = await requirePermission("manage_settings")
  if (!gate.ok) return { error: gate.error === "Forbidden" ? "You cannot edit RSS settings." : "Unauthorized" }

  if (!input.includeChannelPosts && !input.includeFreeformDuas) {
    return { error: "Pick at least one source to include in the feed." }
  }

  const admin = createAdminSupabaseClient()
  const now = new Date().toISOString()

  const rows = [
    { key: SITE_SETTING_KEYS.rssEnabled, value: input.enabled ? "true" : "false", updated_at: now },
    { key: SITE_SETTING_KEYS.rssTitle, value: input.title.trim(), updated_at: now },
    { key: SITE_SETTING_KEYS.rssDescription, value: input.description.trim(), updated_at: now },
    { key: SITE_SETTING_KEYS.rssAuthor, value: input.author.trim(), updated_at: now },
    { key: SITE_SETTING_KEYS.rssCopyright, value: input.copyright.trim(), updated_at: now },
    { key: SITE_SETTING_KEYS.rssLanguage, value: sanitizeLanguage(input.language), updated_at: now },
    { key: SITE_SETTING_KEYS.rssTtlMinutes, value: String(clampInt(input.ttlMinutes, RSS_DEFAULTS.ttlMinutes, 1, 1440)), updated_at: now },
    { key: SITE_SETTING_KEYS.rssItemCount, value: String(clampInt(input.itemCount, RSS_DEFAULTS.itemCount, 1, 50)), updated_at: now },
    { key: SITE_SETTING_KEYS.rssIncludeChannelPosts, value: input.includeChannelPosts ? "true" : "false", updated_at: now },
    { key: SITE_SETTING_KEYS.rssIncludeFreeformDuas, value: input.includeFreeformDuas ? "true" : "false", updated_at: now },
    { key: SITE_SETTING_KEYS.rssExcludedChannelIds, value: JSON.stringify(sanitizeChannelIds(input.excludedChannelIds)), updated_at: now },
    { key: SITE_SETTING_KEYS.rssOnlyVerifiedChannels, value: input.onlyVerifiedChannels ? "true" : "false", updated_at: now },
  ]

  const { error } = await admin.from("site_settings").upsert(rows, { onConflict: "key" })
  if (error) return { error: error.message }

  revalidateTag("site-setting-rss")
  revalidatePath("/feed.xml")
  revalidatePath("/", "layout")
  return { success: true as const }
}
