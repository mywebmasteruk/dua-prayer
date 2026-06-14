"use server"

import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { getAiProviderAdminView, isAiProvider, clampModerationTimeout, type AiProvider, type ModelMode } from "@/lib/ai-provider"
import { SITE_SETTING_KEYS } from "@/lib/settings-keys"

type AiProviderSettingsInput = {
  enabled?: boolean
  provider?: AiProvider
  apiKey?: string
  model?: string
  clearApiKey?: boolean
  modelMode?: ModelMode
  moderationTimeoutMs?: number
}

function canManageAiProviderSettings(ctx: NonNullable<Awaited<ReturnType<typeof getAdminContext>>>) {
  return ctx.isFoundingAdmin || hasPermission(ctx, "manage_settings")
}

async function upsertSetting(key: string, value: string) {
  const admin = createAdminSupabaseClient()
  return admin.from("site_settings").upsert(
    { key, value, updated_at: new Date().toISOString() },
    { onConflict: "key" },
  )
}

async function deleteSetting(key: string) {
  const admin = createAdminSupabaseClient()
  return admin.from("site_settings").delete().eq("key", key)
}

function normalizeModel(value: string | undefined): string {
  return value?.trim() || "gpt-4o-mini"
}

export async function getAiProviderSettingsAdminView() {
  const ctx = await getAdminContext()
  if (!ctx || !canManageAiProviderSettings(ctx)) return null
  return getAiProviderAdminView()
}

export async function updateAiProviderSettings(input: AiProviderSettingsInput) {
  const ctx = await getAdminContext()
  if (!ctx || !canManageAiProviderSettings(ctx)) return { error: "Unauthorized" as const }

  if (input.provider !== undefined && !isAiProvider(input.provider)) {
    return { error: "Choose a supported AI provider." }
  }

  if (input.enabled !== undefined) {
    const { error } = await upsertSetting(SITE_SETTING_KEYS.aiProviderEnabled, input.enabled ? "true" : "false")
    if (error) return { error: error.message }
  }

  if (input.provider !== undefined) {
    const { error } = await upsertSetting(SITE_SETTING_KEYS.aiProviderProvider, input.provider)
    if (error) return { error: error.message }
  }

  if (input.model !== undefined) {
    const { error } = await upsertSetting(SITE_SETTING_KEYS.aiProviderModel, normalizeModel(input.model))
    if (error) return { error: error.message }
  }

  if (input.modelMode !== undefined) {
    const mode: ModelMode = input.modelMode === "auto" ? "auto" : "manual"
    const { error } = await upsertSetting(SITE_SETTING_KEYS.aiProviderModelMode, mode)
    if (error) return { error: error.message }
  }

  if (input.moderationTimeoutMs !== undefined) {
    const ms = clampModerationTimeout(input.moderationTimeoutMs)
    const { error } = await upsertSetting(SITE_SETTING_KEYS.aiModerationTimeoutMs, String(ms))
    if (error) return { error: error.message }
  }

  if (input.clearApiKey) {
    const { error } = await deleteSetting(SITE_SETTING_KEYS.aiProviderApiKey)
    if (error) return { error: error.message }
  } else if (input.apiKey?.trim()) {
    const { error } = await upsertSetting(SITE_SETTING_KEYS.aiProviderApiKey, input.apiKey.trim())
    if (error) return { error: error.message }
  }

  revalidatePath("/admin/integration")
  revalidatePath("/admin/bots")
  return { success: true as const }
}
