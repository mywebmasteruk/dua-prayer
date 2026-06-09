import { cache } from "react"
import { unstable_cache } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { isMissingTableError } from "@/lib/db-errors"
import {
  SITE_COPY_DEFAULTS,
  SITE_SETTING_KEY_MAP,
  type SiteCopy,
  type SiteCopyKey,
} from "@/lib/site-copy"

function withDefaults(values: Partial<SiteCopy>): SiteCopy {
  return {
    sidebarTagline: values.sidebarTagline?.trim() || SITE_COPY_DEFAULTS.sidebarTagline,
    footerTagline: values.footerTagline?.trim() || SITE_COPY_DEFAULTS.footerTagline,
    aboutMission: values.aboutMission?.trim() || SITE_COPY_DEFAULTS.aboutMission,
  }
}

async function fetchSiteCopyFromDb(): Promise<SiteCopy> {
  const supabase = createAdminSupabaseClient()
  const keys = Object.values(SITE_SETTING_KEY_MAP)

  const { data, error } = await supabase.from("site_settings").select("key, value").in("key", keys)

  if (error) {
    if (!isMissingTableError(error)) {
      console.error("Error fetching site copy:", error)
    }
    return withDefaults({})
  }

  const byKey = new Map((data ?? []).map((row) => [row.key, row.value]))
  const partial: Partial<SiteCopy> = {}

  for (const [copyKey, settingKey] of Object.entries(SITE_SETTING_KEY_MAP) as [SiteCopyKey, string][]) {
    const value = byKey.get(settingKey)
    if (value) partial[copyKey] = value
  }

  return withDefaults(partial)
}

const getSiteCopyCached = unstable_cache(fetchSiteCopyFromDb, ["site-copy"], {
  revalidate: 300,
  tags: ["site-copy"],
})

/** Per-request dedup + cross-request cache for public marketing copy. */
export const getSiteCopy = cache(async (): Promise<SiteCopy> => getSiteCopyCached())

export function getSiteCopyDefaults(): SiteCopy {
  return { ...SITE_COPY_DEFAULTS }
}
