"use server"

import {
  createDuaBot,
  deleteDuaBot,
  duplicateDuaBot,
  runDuaBotNow,
  setDuaBotStatus,
  updateDuaBot,
} from "@/app/actions/dua-bots"
import {
  getDuaBotRuntimeStatus,
  listDuaEventBots,
  listRecentBotRuns,
  type BotFormInput,
} from "@/lib/dua-bots"
import { requirePermission } from "@/lib/auth"

// Server actions are POSTable by any visitor — reads need the same gate as
// the mutations in dua-bots.ts (bot configs include source URLs and prompts).
export async function listAdminDuaBots() {
  const gate = await requirePermission("manage_duas")
  if (!gate.ok) return []
  return listDuaEventBots()
}

export async function listRecentAdminDuaBotRuns(limit = 10) {
  const gate = await requirePermission("manage_duas")
  if (!gate.ok) return []
  return listRecentBotRuns(limit)
}

export async function getAdminDuaBotRuntimeStatus() {
  const gate = await requirePermission("manage_duas")
  if (!gate.ok) return null
  return getDuaBotRuntimeStatus()
}

export async function createAdminDuaBot(input: BotFormInput) {
  return createDuaBot(input)
}

export async function updateAdminDuaBot(input: BotFormInput & { id: number }) {
  return updateDuaBot(input)
}

export async function pauseAdminDuaBot(id: number) {
  return setDuaBotStatus(id, "paused")
}

export async function resumeAdminDuaBot(id: number) {
  return setDuaBotStatus(id, "active")
}

export async function duplicateAdminDuaBot(id: number) {
  return duplicateDuaBot(id)
}

export async function deleteAdminDuaBot(id: number) {
  return deleteDuaBot(id)
}

export async function runAdminDuaBotNow(id: number) {
  return runDuaBotNow(id)
}
