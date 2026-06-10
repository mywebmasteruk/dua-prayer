"use server"

import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { getAiModerationAdminView, isAiModerationProvider, type AiModerationProvider } from "@/lib/ai-moderation"
import { SITE_SETTING_KEYS } from "@/lib/settings-keys"

type AiModerationSettingsInput = {
  enabled?: boolean
  provider?: AiModerationProvider
  apiKey?: string
  model?: string
  clearApiKey?: boolean
}

function canManageAiModerationSettings(ctx: NonNullable<Awaited<ReturnType<typeof getAdminContext>>>) {
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

function validateApiKey(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (!/^sk-/.test(trimmed)) return "OpenAI API key should start with sk-."
  return null
}

function normalizeModel(value: string | undefined): string {
  return value?.trim() || "gpt-4o-mini"
}

export async function getAiModerationSettingsAdminView() {
  const ctx = await getAdminContext()
  if (!ctx || !canManageAiModerationSettings(ctx)) return null
  return getAiModerationAdminView()
}

export async function updateAiModerationSettings(input: AiModerationSettingsInput) {
  const ctx = await getAdminContext()
  if (!ctx || !canManageAiModerationSettings(ctx)) return { error: "Unauthorized" as const }

  if (input.provider !== undefined && !isAiModerationProvider(input.provider)) {
    return { error: "Choose a supported AI moderation provider." }
  }

  if (input.enabled !== undefined) {
    const { error } = await upsertSetting(SITE_SETTING_KEYS.aiModerationEnabled, input.enabled ? "true" : "false")
    if (error) return { error: error.message }
  }

  if (input.provider !== undefined) {
    const { error } = await upsertSetting(SITE_SETTING_KEYS.aiModerationProvider, input.provider)
    if (error) return { error: error.message }
  }

  if (input.model !== undefined) {
    const { error } = await upsertSetting(SITE_SETTING_KEYS.aiModerationModel, normalizeModel(input.model))
    if (error) return { error: error.message }
  }

  if (input.clearApiKey) {
    const { error } = await deleteSetting(SITE_SETTING_KEYS.aiModerationApiKey)
    if (error) return { error: error.message }
  } else if (input.apiKey?.trim()) {
    const trimmed = input.apiKey.trim()
    const validationError = validateApiKey(trimmed)
    if (validationError) return { error: validationError }
    const { error } = await upsertSetting(SITE_SETTING_KEYS.aiModerationApiKey, trimmed)
    if (error) return { error: error.message }
  }

  revalidatePath("/admin/integration")
  return { success: true as const }
}
