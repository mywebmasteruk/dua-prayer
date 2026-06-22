import { unstable_cache } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { isMissingTableError } from "@/lib/db-errors"
import { SITE_SETTING_KEYS } from "@/lib/settings-keys"

export type SeoSettings = {
  /** Brand/site name (og:site_name, title template suffix). */
  siteName: string
  /** Default page title (also og:title / twitter:title). */
  title: string
  /** Meta description (also og:description / twitter:description). */
  description: string
  /** Social share image — absolute URL or root-relative path (og:image). */
  image: string
  /** Favicon — absolute URL or root-relative path. */
  favicon: string
}

// Current shipped values stay the defaults so nothing regresses before an admin
// fills the form in.
export const SEO_DEFAULTS: SeoSettings = {
  siteName: "DuaPrayer",
  title: "DuaPrayer — Make Dua & Pray For The Ummah",
  description: "Share duas and pray for the Muslim Ummah. A community prayer wall.",
  image: "/og-image.png",
  favicon: "/favicon.png",
} as const

const SEO_KEYS = [
  SITE_SETTING_KEYS.seoSiteName,
  SITE_SETTING_KEYS.seoTitle,
  SITE_SETTING_KEYS.seoDescription,
  SITE_SETTING_KEYS.seoImage,
  SITE_SETTING_KEYS.seoFavicon,
] as const

async function fetchSeoSettings(): Promise<SeoSettings> {
  let supabase
  try {
    supabase = createAdminSupabaseClient()
  } catch (error) {
    console.error("SEO settings: missing Supabase credentials", error)
    return { ...SEO_DEFAULTS }
  }

  const { data, error } = await supabase.from("site_settings").select("key, value").in("key", SEO_KEYS)

  if (error) {
    if (!isMissingTableError(error)) {
      console.error("Error fetching SEO settings:", error)
    }
    return { ...SEO_DEFAULTS }
  }

  const byKey = new Map((data ?? []).map((row) => [row.key, (row.value as string | null)?.trim() || ""]))
  return {
    siteName: byKey.get(SITE_SETTING_KEYS.seoSiteName) || SEO_DEFAULTS.siteName,
    title: byKey.get(SITE_SETTING_KEYS.seoTitle) || SEO_DEFAULTS.title,
    description: byKey.get(SITE_SETTING_KEYS.seoDescription) || SEO_DEFAULTS.description,
    image: byKey.get(SITE_SETTING_KEYS.seoImage) || SEO_DEFAULTS.image,
    favicon: byKey.get(SITE_SETTING_KEYS.seoFavicon) || SEO_DEFAULTS.favicon,
  }
}

const getSeoSettingsCached = unstable_cache(fetchSeoSettings, ["site-setting-seo"], {
  revalidate: 300,
  tags: ["site-setting-seo"],
})

export async function getSeoSettings(): Promise<SeoSettings> {
  return getSeoSettingsCached()
}

/** Uncached read for the admin form — caller must enforce RBAC. */
export async function getSeoSettingsForAdmin(): Promise<SeoSettings> {
  return fetchSeoSettings()
}
