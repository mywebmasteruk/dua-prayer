"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { requirePermission } from "@/lib/auth"
import { isMissingTableError } from "@/lib/db-errors"
import {
  SITE_COPY_DEFAULTS,
  SITE_COPY_LABELS,
  SITE_SETTING_KEY_MAP,
  type SiteCopy,
  type SiteCopyKey,
} from "@/lib/site-copy"
import { getSiteCopyDefaults } from "@/lib/site-copy-server"

export async function getSiteCopyForAdmin(): Promise<SiteCopy> {
  const gate = await requirePermission("manage_settings")
  if (!gate.ok) return getSiteCopyDefaults()

  const admin = createAdminSupabaseClient()
  const keys = Object.values(SITE_SETTING_KEY_MAP)
  const { data, error } = await admin.from("site_settings").select("key, value").in("key", keys)

  if (error) {
    if (!isMissingTableError(error)) {
      console.error("Error fetching site copy for admin:", error)
    }
    return getSiteCopyDefaults()
  }

  const byKey = new Map((data ?? []).map((row) => [row.key, row.value]))
  const result = {} as SiteCopy

  for (const [copyKey, settingKey] of Object.entries(SITE_SETTING_KEY_MAP) as [SiteCopyKey, string][]) {
    result[copyKey] = byKey.get(settingKey) ?? SITE_COPY_DEFAULTS[copyKey]
  }

  return result
}

export async function updateSiteCopy(input: Partial<SiteCopy>) {
  const gate = await requirePermission("manage_settings")
  if (!gate.ok) return { error: gate.error === "Forbidden" ? "You cannot edit site content." : "Unauthorized" }

  const admin = createAdminSupabaseClient()
  const now = new Date().toISOString()

  for (const [copyKey, settingKey] of Object.entries(SITE_SETTING_KEY_MAP) as [SiteCopyKey, string][]) {
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
  revalidatePath("/channels")
  revalidatePath("/donate")
  revalidatePath("/admin/copy")
  revalidatePath("/admin/site-content")
  revalidateTag("site-copy")
  return { success: true as const }
}
