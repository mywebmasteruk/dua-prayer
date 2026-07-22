"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { getAdminContext, hasPermission, requirePermission } from "@/lib/auth"
import { sanitizeBannerColor } from "@/lib/banner-rich-text"
import {
  BETA_BANNER_DEFAULTS,
  getBetaBannerSettingsForAdmin,
  getChannelFormRegistryForAdmin,
  getVolunteerFormRegistryForAdmin,
} from "@/lib/site-settings-server"
import { SITE_SETTING_KEYS } from "@/lib/settings-keys"
import { isPostingMode, type PostingMode } from "@/lib/posting-settings"
import {
  DEFAULT_CHANNEL_REGISTRY,
  DEFAULT_VOLUNTEER_REGISTRY,
  parseFormRegistry,
  serializeFormRegistry,
  visibleFields,
  REQUIRED_CHANNEL_BINDINGS,
  REQUIRED_VOLUNTEER_BINDINGS,
  type FormRegistry,
} from "@/lib/form-fields"

/** Returns an error message if a required system binding has no enabled field. */
function missingBindingError(registry: FormRegistry, requiredBindings: readonly string[]): string | null {
  const present = new Set(visibleFields(registry).map((field) => field.systemBinding))
  const missing = requiredBindings.filter((binding) => !present.has(binding))
  if (missing.length === 0) return null
  return `These required fields must stay enabled: ${missing.join(", ")}.`
}

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

export async function getChannelFormRegistryForBuilder(): Promise<FormRegistry> {
  const ctx = await getAdminContext()
  if (!ctx || !canManageChannelSettings(ctx)) return DEFAULT_CHANNEL_REGISTRY
  return getChannelFormRegistryForAdmin()
}

export async function updateChannelFormRegistry(registry: FormRegistry) {
  const ctx = await getAdminContext()
  if (!ctx || !canManageChannelSettings(ctx)) return { error: "Unauthorized" as const }

  const normalized = parseFormRegistry(serializeFormRegistry(registry), DEFAULT_CHANNEL_REGISTRY)
  const bindingError = missingBindingError(normalized, REQUIRED_CHANNEL_BINDINGS)
  if (bindingError) return { error: bindingError }

  const admin = createAdminSupabaseClient()
  const { error } = await admin.from("site_settings").upsert(
    {
      key: SITE_SETTING_KEYS.channelFormFields,
      value: serializeFormRegistry(normalized),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  )
  if (error) return { error: error.message }

  revalidatePath("/channels/apply")
  revalidatePath("/admin/channels")
  revalidateTag("site-setting-channel-form")
  return { success: true as const }
}

export async function getVolunteerFormRegistryForBuilder(): Promise<FormRegistry> {
  const ctx = await getAdminContext()
  if (!ctx || !canManageVolunteerSettings(ctx)) return DEFAULT_VOLUNTEER_REGISTRY
  return getVolunteerFormRegistryForAdmin()
}

export async function updateVolunteerFormRegistry(registry: FormRegistry) {
  const ctx = await getAdminContext()
  if (!ctx || !canManageVolunteerSettings(ctx)) return { error: "Unauthorized" as const }

  const normalized = parseFormRegistry(serializeFormRegistry(registry), DEFAULT_VOLUNTEER_REGISTRY)
  const bindingError = missingBindingError(normalized, REQUIRED_VOLUNTEER_BINDINGS)
  if (bindingError) return { error: bindingError }

  const admin = createAdminSupabaseClient()
  const { error } = await admin.from("site_settings").upsert(
    {
      key: SITE_SETTING_KEYS.volunteerFormFields,
      value: serializeFormRegistry(normalized),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  )
  if (error) return { error: error.message }

  revalidatePath("/volunteer")
  revalidatePath("/admin/volunteers")
  revalidateTag("site-setting-volunteer-form")
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
