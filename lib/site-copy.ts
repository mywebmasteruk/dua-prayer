import { createServerSupabaseClient } from "@/lib/supabase/server"
import { isMissingTableError } from "@/lib/db-errors"
import { SITE_SETTING_KEYS } from "@/lib/settings-keys"

export const SITE_COPY_DEFAULTS = {
  sidebarTagline: "Share duas, support one another, and grow together in faith.",
  footerTagline:
    "A nonprofit community platform for sharing duas and responding with ameen — free for the Ummah.",
  aboutMission:
    "DuaPrayer is a nonprofit community platform where people share prayer requests and respond with ameen. We build simple, welcoming technology so collective duas can travel further — without replacing scholars, counselors, or local communities.",
} as const

export type SiteCopyKey = keyof typeof SITE_COPY_DEFAULTS

const KEY_MAP: Record<SiteCopyKey, string> = {
  sidebarTagline: SITE_SETTING_KEYS.copySidebarTagline,
  footerTagline: SITE_SETTING_KEYS.copyFooterTagline,
  aboutMission: SITE_SETTING_KEYS.copyAboutMission,
}

export const SITE_COPY_LABELS: Record<SiteCopyKey, { label: string; description: string }> = {
  sidebarTagline: {
    label: "Sidebar tagline",
    description: "Short line under the logo in the left navigation.",
  },
  footerTagline: {
    label: "Footer tagline",
    description: "One-line description in the site footer.",
  },
  aboutMission: {
    label: "About mission",
    description: "Intro paragraph on the About page.",
  },
}

export type SiteCopy = Record<SiteCopyKey, string>

function withDefaults(values: Partial<SiteCopy>): SiteCopy {
  return {
    sidebarTagline: values.sidebarTagline?.trim() || SITE_COPY_DEFAULTS.sidebarTagline,
    footerTagline: values.footerTagline?.trim() || SITE_COPY_DEFAULTS.footerTagline,
    aboutMission: values.aboutMission?.trim() || SITE_COPY_DEFAULTS.aboutMission,
  }
}

export async function getSiteCopy(): Promise<SiteCopy> {
  const supabase = await createServerSupabaseClient()
  const keys = Object.values(KEY_MAP)

  const { data, error } = await supabase.from("site_settings").select("key, value").in("key", keys)

  if (error) {
    if (!isMissingTableError(error)) {
      console.error("Error fetching site copy:", error)
    }
    return withDefaults({})
  }

  const byKey = new Map((data ?? []).map((row) => [row.key, row.value]))
  const partial: Partial<SiteCopy> = {}

  for (const [copyKey, settingKey] of Object.entries(KEY_MAP) as [SiteCopyKey, string][]) {
    const value = byKey.get(settingKey)
    if (value) partial[copyKey] = value
  }

  return withDefaults(partial)
}

export function getSiteCopyDefaults(): SiteCopy {
  return { ...SITE_COPY_DEFAULTS }
}
