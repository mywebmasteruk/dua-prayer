"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { requirePermission } from "@/lib/auth"
import { SITE_SETTING_KEYS } from "@/lib/settings-keys"
import { getFooterLinksForAdminRead, type FooterLink } from "@/lib/footer-links-server"

export async function getFooterLinksForAdmin(): Promise<FooterLink[]> {
  const gate = await requirePermission("manage_settings")
  if (!gate.ok) return []
  return getFooterLinksForAdminRead()
}

// Accepts root-relative paths ("/about"), full http(s) URLs, mailto:, tel:, and
// anchor links ("#contact"). Rejects javascript: and other unsafe schemes.
function sanitizeHref(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed
  if (/^mailto:/i.test(trimmed) || /^tel:/i.test(trimmed)) return trimmed
  try {
    const url = new URL(trimmed)
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : ""
  } catch {
    return ""
  }
}

export async function saveFooterLinks(input: FooterLink[]) {
  const gate = await requirePermission("manage_settings")
  if (!gate.ok) return { error: gate.error === "Forbidden" ? "You cannot edit footer links." : "Unauthorized" }

  const cleaned: FooterLink[] = []
  for (let i = 0; i < input.length; i++) {
    const link = input[i]
    const label = link.label.trim()
    const href = sanitizeHref(link.href)
    if (!label) return { error: `Link #${i + 1} is missing a label.` }
    if (!href) return { error: `Link #${i + 1} has an invalid URL.` }
    cleaned.push({ label, href, openInNewTab: link.openInNewTab === true })
  }

  if (cleaned.length > 50) return { error: "You can save at most 50 footer links." }

  const admin = createAdminSupabaseClient()
  const { error } = await admin
    .from("site_settings")
    .upsert(
      { key: SITE_SETTING_KEYS.footerLinks, value: JSON.stringify(cleaned), updated_at: new Date().toISOString() },
      { onConflict: "key" },
    )
  if (error) return { error: error.message }

  revalidateTag("site-setting-footer-links")
  revalidatePath("/", "layout")
  return { success: true as const }
}
