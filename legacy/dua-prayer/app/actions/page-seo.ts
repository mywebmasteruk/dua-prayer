"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { requirePermission } from "@/lib/auth"
import {
  PAGE_SEO_PAGES,
  PAGE_SEO_CACHE_TAG,
  pageSeoKey,
  type PageSeoSlug,
  type PageSeoOverrides,
} from "@/lib/page-seo-server"

// Accept an absolute http(s) URL or a root-relative path ("/foo.png"). Empty
// stays empty so the server module falls back to the global SEO image.
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

export async function savePageSeo(slug: PageSeoSlug, input: PageSeoOverrides) {
  const gate = await requirePermission("manage_settings")
  if (!gate.ok) return { error: gate.error === "Forbidden" ? "You cannot edit page SEO." : "Unauthorized" }

  const page = PAGE_SEO_PAGES.find((p) => p.slug === slug)
  if (!page) return { error: "Unknown page." }

  const image = sanitizeAssetUrl(input.image)
  if (input.image.trim() && !image) {
    return { error: "Image must be a full https:// URL or a path like /og-image.png." }
  }

  const admin = createAdminSupabaseClient()
  const now = new Date().toISOString()

  const rows = [
    { key: pageSeoKey(slug, "title"), value: input.title.trim(), updated_at: now },
    { key: pageSeoKey(slug, "description"), value: input.description.trim(), updated_at: now },
    { key: pageSeoKey(slug, "image"), value: image, updated_at: now },
  ]

  const { error } = await admin.from("site_settings").upsert(rows, { onConflict: "key" })
  if (error) return { error: error.message }

  revalidateTag(PAGE_SEO_CACHE_TAG)
  revalidatePath(page.path)
  return { success: true as const }
}
