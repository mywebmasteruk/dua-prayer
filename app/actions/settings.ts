"use server"

import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getAdminContext, hasPermission, requirePermission } from "@/lib/auth"
import { parseFilloutEmbed } from "@/lib/fillout"
import { SITE_SETTING_KEYS } from "@/lib/settings-keys"

async function getSettingValue(key: string): Promise<string | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle()

  if (error) {
    console.error(`Error fetching site setting ${key}:`, error)
    return null
  }

  return data?.value ?? null
}

function canManageVolunteerSettings(ctx: NonNullable<Awaited<ReturnType<typeof getAdminContext>>>) {
  return hasPermission(ctx, "manage_settings") || hasPermission(ctx, "manage_volunteers")
}

export async function getVolunteerFilloutEmbedSrc(): Promise<string | null> {
  const raw = await getSettingValue(SITE_SETTING_KEYS.volunteerFilloutEmbed)
  if (!raw) return null

  const parsed = parseFilloutEmbed(raw)
  return parsed?.src ?? null
}

export async function getVolunteerFilloutSettingForAdmin(): Promise<string> {
  const ctx = await getAdminContext()
  if (!ctx || !canManageVolunteerSettings(ctx)) return ""

  const admin = createAdminSupabaseClient()
  const { data, error } = await admin
    .from("site_settings")
    .select("value")
    .eq("key", SITE_SETTING_KEYS.volunteerFilloutEmbed)
    .maybeSingle()

  if (error) {
    console.error("Error fetching volunteer fillout setting:", error)
    return ""
  }

  return data?.value ?? ""
}

export async function updateVolunteerFilloutSetting(rawInput: string) {
  const ctx = await getAdminContext()
  if (!ctx || !canManageVolunteerSettings(ctx)) return { error: "Unauthorized" as const }

  const trimmed = rawInput.trim()

  if (!trimmed) {
    const admin = createAdminSupabaseClient()
    const { error } = await admin.from("site_settings").delete().eq("key", SITE_SETTING_KEYS.volunteerFilloutEmbed)
    if (error) return { error: error.message }

    revalidatePath("/admin/settings")
    revalidatePath("/volunteer")
    return { success: true as const }
  }

  const parsed = parseFilloutEmbed(trimmed)
  if (!parsed) {
    return {
      error:
        "Invalid Fillout embed. Paste an iframe snippet, a https://forms.fillout.com/t/… URL, or the form ID only.",
    }
  }

  const admin = createAdminSupabaseClient()
  const { error } = await admin.from("site_settings").upsert(
    {
      key: SITE_SETTING_KEYS.volunteerFilloutEmbed,
      value: parsed.src,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  )

  if (error) return { error: error.message }

  revalidatePath("/admin/settings")
  revalidatePath("/volunteer")
  return { success: true as const }
}

export async function requireSiteSettingsAccess() {
  const gate = await requirePermission("manage_settings")
  if (gate.ok) return gate
  return requirePermission("manage_volunteers")
}
