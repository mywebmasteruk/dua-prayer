"use server"

import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { requirePermission } from "@/lib/auth"
import { buildDuplicateDuaBotInsert } from "@/lib/dua-bot-duplicates"
import { normalizeBotInput, runDueDuaBots, type BotFormInput, type BotStatus, type DuaBot } from "@/lib/dua-bots"

function botsPath() {
  revalidatePath("/admin/bots")
  revalidatePath("/admin")
  revalidatePath("/")
}

export async function createDuaBot(input: BotFormInput) {
  const gate = await requirePermission("manage_duas")
  if (!gate.ok) return { error: "Unauthorized" }

  const normalized = normalizeBotInput(input)
  if ("error" in normalized) return { error: normalized.error }

  const admin = createAdminSupabaseClient()
  const { error } = await admin.from("dua_bots").insert({
    ...normalized.value,
    next_run_at: normalized.value.status === "active" ? new Date().toISOString() : null,
    created_by: gate.user.id,
    updated_by: gate.user.id,
  })

  if (error) return { error: error.message }
  botsPath()
  return { success: true as const }
}

export async function updateDuaBot(input: BotFormInput & { id: number }) {
  const gate = await requirePermission("manage_duas")
  if (!gate.ok) return { error: "Unauthorized" }
  if (!Number.isInteger(input.id)) return { error: "Choose a valid bot." }

  const normalized = normalizeBotInput(input)
  if ("error" in normalized) return { error: normalized.error }

  const admin = createAdminSupabaseClient()
  const { error } = await admin
    .from("dua_bots")
    .update({ ...normalized.value, updated_by: gate.user.id, updated_at: new Date().toISOString() })
    .eq("id", input.id)

  if (error) return { error: error.message }
  botsPath()
  return { success: true as const }
}

export async function duplicateDuaBot(id: number) {
  const gate = await requirePermission("manage_duas")
  if (!gate.ok) return { error: "Unauthorized" }
  if (!Number.isInteger(id)) return { error: "Choose a valid bot." }

  const admin = createAdminSupabaseClient()
  const { data: bot, error: loadError } = await admin
    .from("dua_bots")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (loadError) return { error: loadError.message }
  if (!bot) return { error: "Bot not found." }

  const { error: insertError } = await admin
    .from("dua_bots")
    .insert(buildDuplicateDuaBotInsert(bot as DuaBot, gate.user.id))

  if (insertError) return { error: insertError.message }
  botsPath()
  return { success: true as const }
}

export async function setDuaBotStatus(id: number, status: BotStatus) {
  const gate = await requirePermission("manage_duas")
  if (!gate.ok) return { error: "Unauthorized" }
  if (!Number.isInteger(id)) return { error: "Choose a valid bot." }

  const admin = createAdminSupabaseClient()
  const { error } = await admin
    .from("dua_bots")
    .update({
      status,
      next_run_at: status === "active" ? new Date().toISOString() : null,
      updated_by: gate.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) return { error: error.message }
  botsPath()
  return { success: true as const }
}

export async function runDuaBotNow(id: number) {
  const gate = await requirePermission("manage_duas")
  if (!gate.ok) return { error: "Unauthorized" }
  if (!Number.isInteger(id)) return { error: "Choose a valid bot." }

  try {
    const result = await runDueDuaBots({ botId: id, manual: true })
    botsPath()
    return { success: true as const, result }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}
