import { unstable_cache } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { isMissingTableError } from "@/lib/db-errors"
import { parseFilloutEmbed } from "@/lib/fillout"
import { SITE_SETTING_KEYS } from "@/lib/settings-keys"

async function fetchSiteSettingValue(key: string): Promise<string | null> {
  let supabase
  try {
    supabase = createAdminSupabaseClient()
  } catch (error) {
    console.error(`Site setting ${key}: missing Supabase credentials`, error)
    return null
  }

  const { data, error } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle()

  if (error) {
    if (!isMissingTableError(error)) {
      console.error(`Error fetching site setting ${key}:`, error)
    }
    return null
  }

  return data?.value ?? null
}

const getVolunteerFilloutSettingCached = unstable_cache(
  () => fetchSiteSettingValue(SITE_SETTING_KEYS.volunteerFilloutEmbed),
  ["site-setting-volunteer-fillout"],
  { revalidate: 300, tags: ["site-setting-volunteer-fillout"] },
)

export async function getVolunteerFilloutEmbedSrc(): Promise<string | null> {
  const raw = await getVolunteerFilloutSettingCached()
  if (!raw) return null

  const parsed = parseFilloutEmbed(raw)
  return parsed?.src ?? null
}

/** Uncached read for admin integration UI — caller must enforce RBAC. */
export async function getVolunteerFilloutSettingValue(): Promise<string> {
  const value = await fetchSiteSettingValue(SITE_SETTING_KEYS.volunteerFilloutEmbed)
  return value ?? ""
}
