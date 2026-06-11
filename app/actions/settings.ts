"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { getAdminContext, hasPermission, requirePermission } from "@/lib/auth"
import { sanitizeBannerColor } from "@/lib/banner-rich-text"
import { parseFilloutEmbed } from "@/lib/fillout"
import {
  BETA_BANNER_DEFAULTS,
  getBetaBannerSettingsForAdmin,
  getChannelFilloutSettingValue,
  getVolunteerFilloutSettingValue,
} from "@/lib/site-settings-server"
import { SITE_SETTING_KEYS } from "@/lib/settings-keys"
import { isPostingMode, type PostingMode } from "@/lib/posting-settings"

function canManageVolunteerSettings(ctx: NonNullable<Awaited<ReturnType<typeof getAdminContext>>>) {
  return hasPermission(ctx, "manage_settings") || hasPermission(ctx, "manage_volunteers")
}

function canManageChannelSettings(ctx: NonNullable<Awaited<ReturnType<typeof getAdminContext>>>) {
  return hasPermission(ctx, "manage_settings") || hasPermission(ctx, "manage_channels")
}

type BetaBannerSettingsInput = {
  enabled: boolean
  message: string
  bgColor: string
}

export async function getBetaBannerSettingsForSuperAdmin() {
  const ctx = await getAdminContext()
  if (!ctx?.isFoundingAdmin) return { ...BETA_BANNER_DEFAULTS }
  return getBetaBannerSettingsForAdmin()
}

export async function updateBetaBannerSettings(input: BetaBannerSettingsInput) {
  const ctx = await getAdminContext()
  if (!ctx?.isFoundingAdmin) return { error: "Unauthorized" as const }

  const message = input.message.trim() || BETA_BANNER_DEFAULTS.message
  const bgColor = sanitizeBannerColor(input.bgColor, BETA_BANNER_DEFAULTS.bgColor)
  const admin = createAdminSupabaseClient()
  const now = new Date().toISOString()
  const rows = [
    { key: SITE_SETTING_KEYS.betaBannerEnabled, value: input.enabled ? "true" : "false", updated_at: now },
    { key: SITE_SETTING_KEYS.betaBannerMessage, value: message, updated_at: now },
    { key: SITE_SETTING_KEYS.betaBannerBgColor, value: bgColor, updated_at: now },
  ]

  const { error } = await admin.from("site_settings").upsert(rows, { onConflict: "key" })
  if (error) return { error: error.message }

  revalidatePath("/")
  revalidatePath("/admin/settings")
  revalidateTag("site-setting-beta-banner")
  return { success: true as const }
}

export async function getVolunteerFilloutSettingForAdmin(): Promise<string> {
  const ctx = await getAdminContext()
  if (!ctx || !canManageVolunteerSettings(ctx)) return ""
  return getVolunteerFilloutSettingValue()
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
    revalidateTag("site-setting-volunteer-fillout")
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
  revalidateTag("site-setting-volunteer-fillout")
  return { success: true as const }
}

export async function getChannelFilloutSettingForAdmin(): Promise<string> {
  const ctx = await getAdminContext()
  if (!ctx || !canManageChannelSettings(ctx)) return ""
  return getChannelFilloutSettingValue()
}

export async function updateChannelFilloutSetting(rawInput: string) {
  const ctx = await getAdminContext()
  if (!ctx || !canManageChannelSettings(ctx)) return { error: "Unauthorized" as const }

  const trimmed = rawInput.trim()

  if (!trimmed) {
    const admin = createAdminSupabaseClient()
    const { error } = await admin.from("site_settings").delete().eq("key", SITE_SETTING_KEYS.channelFilloutEmbed)
    if (error) return { error: error.message }

    revalidatePath("/admin/channels")
    revalidatePath("/channels/apply")
    revalidateTag("site-setting-channel-fillout")
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
      key: SITE_SETTING_KEYS.channelFilloutEmbed,
      value: parsed.src,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  )

  if (error) return { error: error.message }

  revalidatePath("/admin/channels")
  revalidatePath("/channels/apply")
  revalidateTag("site-setting-channel-fillout")
  return { success: true as const }
}

export async function updatePostingMode(mode: PostingMode) {
  const gate = await requirePermission("manage_settings")
  if (!gate.ok) return { error: gate.error }
  if (!isPostingMode(mode)) return { error: "Choose a supported posting mode." }

  const admin = createAdminSupabaseClient()
  const { error } = await admin.from("site_settings").upsert(
    {
      key: SITE_SETTING_KEYS.postingMode,
      value: mode,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  )

  if (error) return { error: error.message }

  revalidatePath("/")
  revalidatePath("/admin/settings")
  revalidateTag("site-setting-posting-mode")
  return { success: true as const }
}

export async function requireSiteSettingsAccess() {
  const gate = await requirePermission("manage_settings")
  if (gate.ok) return gate
  return requirePermission("manage_volunteers")
}
