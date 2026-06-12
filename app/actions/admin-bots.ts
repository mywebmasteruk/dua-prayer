"use server"

import {
  createDuaBot,
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

export async function listAdminDuaBots() {
  return listDuaEventBots()
}

export async function listRecentAdminDuaBotRuns(limit = 10) {
  return listRecentBotRuns(limit)
}

export async function getAdminDuaBotRuntimeStatus() {
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

export async function runAdminDuaBotNow(id: number) {
  return runDuaBotNow(id)
}
