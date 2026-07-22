"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { requirePermission } from "@/lib/auth"
import { SITE_SETTING_KEYS } from "@/lib/settings-keys"
import { getSeoSettings, SEO_DEFAULTS, type SeoSettings } from "@/lib/seo-settings-server"

export async function getSeoSettingsForAdmin(): Promise<SeoSettings> {
  const gate = await requirePermission("manage_settings")
  if (!gate.ok) return { ...SEO_DEFAULTS }
  return getSeoSettings()
}

// Accept an absolute http(s) URL or a root-relative path ("/foo.png"). Empty
// stays empty so the server module falls back to the shipped default.
function sanitizeAssetUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (trimmed.startsWith("/")) return trimmed
  try {
    const url = new URL(trimmed)
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : ""
  } catch {
    return ""
  }
}

export async function saveSeoSettings(input: SeoSettings) {
  const gate = await requirePermission("manage_settings")
  if (!gate.ok) return { error: gate.error === "Forbidden" ? "You cannot edit SEO settings." : "Unauthorized" }

  const image = sanitizeAssetUrl(input.image)
  if (input.image.trim() && !image) return { error: "Site image must be a full https:// URL or a path like /logo-wide.png." }
  const favicon = sanitizeAssetUrl(input.favicon)
  if (input.favicon.trim() && !favicon) return { error: "Favicon must be a full https:// URL or a path like /favicon.png." }

  const admin = createAdminSupabaseClient()
  const now = new Date().toISOString()

  const rows = [
    { key: SITE_SETTING_KEYS.seoSiteName, value: input.siteName.trim(), updated_at: now },
    { key: SITE_SETTING_KEYS.seoTitle, value: input.title.trim(), updated_at: now },
    { key: SITE_SETTING_KEYS.seoDescription, value: input.description.trim(), updated_at: now },
    { key: SITE_SETTING_KEYS.seoImage, value: image, updated_at: now },
    { key: SITE_SETTING_KEYS.seoFavicon, value: favicon, updated_at: now },
  ]

  const { error } = await admin.from("site_settings").upsert(rows, { onConflict: "key" })
  if (error) return { error: error.message }

  revalidatePath("/", "layout")
  revalidateTag("site-setting-seo")
  return { success: true as const }
}
