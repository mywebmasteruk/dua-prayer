"use server"

import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { requirePermission } from "@/lib/auth"
import { isMissingTableError } from "@/lib/db-errors"
import { SITE_SETTING_KEYS } from "@/lib/settings-keys"
import {
  SITE_COPY_DEFAULTS,
  SITE_COPY_LABELS,
  type SiteCopy,
  type SiteCopyKey,
} from "@/lib/site-copy"
import { getSiteCopyDefaults } from "@/lib/site-copy-server"

const COPY_SETTING_KEYS: Record<SiteCopyKey, string> = {
  sidebarTagline: SITE_SETTING_KEYS.copySidebarTagline,
  footerTagline: SITE_SETTING_KEYS.copyFooterTagline,
  aboutMission: SITE_SETTING_KEYS.copyAboutMission,
}

export async function getSiteCopyForAdmin(): Promise<SiteCopy> {
  const gate = await requirePermission("manage_settings")
  if (!gate.ok) return getSiteCopyDefaults()

  const admin = createAdminSupabaseClient()
  const keys = Object.values(COPY_SETTING_KEYS)
  const { data, error } = await admin.from("site_settings").select("key, value").in("key", keys)

  if (error) {
    if (!isMissingTableError(error)) {
      console.error("Error fetching site copy for admin:", error)
    }
    return getSiteCopyDefaults()
  }

  const byKey = new Map((data ?? []).map((row) => [row.key, row.value]))
  return {
    sidebarTagline: byKey.get(COPY_SETTING_KEYS.sidebarTagline) ?? SITE_COPY_DEFAULTS.sidebarTagline,
    footerTagline: byKey.get(COPY_SETTING_KEYS.footerTagline) ?? SITE_COPY_DEFAULTS.footerTagline,
    aboutMission: byKey.get(COPY_SETTING_KEYS.aboutMission) ?? SITE_COPY_DEFAULTS.aboutMission,
  }
}

export async function updateSiteCopy(input: Partial<SiteCopy>) {
  const gate = await requirePermission("manage_settings")
  if (!gate.ok) return { error: gate.error === "Forbidden" ? "You cannot edit site copy." : "Unauthorized" }

  const admin = createAdminSupabaseClient()
  const now = new Date().toISOString()

  for (const [copyKey, settingKey] of Object.entries(COPY_SETTING_KEYS) as [SiteCopyKey, string][]) {
    const value = input[copyKey]
    if (value === undefined) continue

    const trimmed = value.trim()
    if (!trimmed) {
      return { error: `${SITE_COPY_LABELS[copyKey].label} cannot be empty.` }
    }

    const { error } = await admin.from("site_settings").upsert(
      { key: settingKey, value: trimmed, updated_at: now },
      { onConflict: "key" },
    )

    if (error) return { error: error.message }
  }

  revalidatePath("/")
  revalidatePath("/about")
  revalidatePath("/admin/copy")
  return { success: true as const }
}
