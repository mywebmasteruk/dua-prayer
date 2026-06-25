import { unstable_cache } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { isMissingTableError } from "@/lib/db-errors"
import { SITE_SETTING_KEYS } from "@/lib/settings-keys"

export type FooterLink = {
  label: string
  href: string
  openInNewTab: boolean
}

// Used when admin hasn't saved anything yet (or saves an empty list).
// Keeps the footer working out of the box.
export const FOOTER_LINK_DEFAULTS: ReadonlyArray<FooterLink> = [
  { label: "Home", href: "/", openInNewTab: false },
  { label: "Donate", href: "/donate", openInNewTab: false },
  { label: "Volunteer", href: "/volunteer", openInNewTab: false },
]

function sanitizeLink(raw: unknown): FooterLink | null {
  if (!raw || typeof raw !== "object") return null
  const obj = raw as Record<string, unknown>
  const label = typeof obj.label === "string" ? obj.label.trim() : ""
  const href = typeof obj.href === "string" ? obj.href.trim() : ""
  if (!label || !href) return null
  return {
    label,
    href,
    openInNewTab: obj.openInNewTab === true,
  }
}

function parseLinks(value: string | null | undefined): FooterLink[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.map(sanitizeLink).filter((link): link is FooterLink => link !== null)
  } catch {
    return []
  }
}

async function fetchFooterLinks(): Promise<FooterLink[]> {
  let supabase
  try {
    supabase = createAdminSupabaseClient()
  } catch (error) {
    console.error("Footer links: missing Supabase credentials", error)
    return []
  }

  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", SITE_SETTING_KEYS.footerLinks)
    .maybeSingle()

  if (error) {
    if (!isMissingTableError(error)) {
      console.error("Error fetching footer links:", error)
    }
    return []
  }

  return parseLinks((data?.value as string | null) ?? null)
}

const getFooterLinksCached = unstable_cache(fetchFooterLinks, ["site-setting-footer-links"], {
  revalidate: 300,
  tags: ["site-setting-footer-links"],
})

/** Public read. Returns the admin-saved list, or the built-in defaults if empty. */
export async function getFooterLinks(): Promise<ReadonlyArray<FooterLink>> {
  const saved = await getFooterLinksCached()
  return saved.length > 0 ? saved : FOOTER_LINK_DEFAULTS
}

/** Admin read — returns exactly what's saved (empty if nothing). Caller enforces RBAC. */
export async function getFooterLinksForAdminRead(): Promise<FooterLink[]> {
  return fetchFooterLinks()
}
