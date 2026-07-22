"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { requirePermission } from "@/lib/auth"
import { SITE_SETTING_KEYS } from "@/lib/settings-keys"
import { getCustomCode, type CustomCode } from "@/lib/custom-code-server"

export async function getCustomCodeForAdmin(): Promise<CustomCode> {
  const gate = await requirePermission("manage_settings")
  if (!gate.ok) return { header: "", footer: "" }
  return getCustomCode()
}

export async function saveCustomCode(input: CustomCode) {
  const gate = await requirePermission("manage_settings")
  if (!gate.ok) return { error: gate.error === "Forbidden" ? "You cannot edit custom code." : "Unauthorized" }

  const admin = createAdminSupabaseClient()
  const now = new Date().toISOString()

  const rows = [
    { key: SITE_SETTING_KEYS.customCodeHeader, value: input.header, updated_at: now },
    { key: SITE_SETTING_KEYS.customCodeFooter, value: input.footer, updated_at: now },
  ]

  const { error } = await admin.from("site_settings").upsert(rows, { onConflict: "key" })
  if (error) return { error: error.message }

  revalidatePath("/")
  revalidateTag("custom-code")
  return { success: true as const }
}
