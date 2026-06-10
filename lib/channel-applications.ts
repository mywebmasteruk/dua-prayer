import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { findAuthUserIdByEmail } from "@/lib/auth-users"
import {
  channelHandleFromName,
  normalizeChannelHandle,
  type ChannelApplicationPayload,
  type ChannelStatus,
} from "@/lib/channel-types"
import type { ChannelApplicationInput } from "@/lib/channel-application-types"

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function notifyChannelApplicationWebhook(payload: Record<string, unknown>) {
  const url = process.env.CHANNEL_NOTIFY_WEBHOOK_URL?.trim()
  if (!url) return

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "channel.application.created",
        timestamp: new Date().toISOString(),
        ...payload,
      }),
    })
  } catch (error) {
    console.error("Channel application notify webhook failed:", error)
  }
}

export type ChannelApplicationRegistrationResult =
  | {
      ok: true
      channelId: number
      status: ChannelStatus
      created: boolean
    }
  | { ok: false; error: string; status?: number }

async function findUserIdByEmail(email: string): Promise<string | null> {
  const { userId } = await findAuthUserIdByEmail(email)
  return userId
}

async function findExistingByFilloutSubmissionId(submissionId: string) {
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin
    .from("categories")
    .select("id, status")
    .eq("channel_type", "user")
    .contains("application", { filloutSubmissionId: submissionId })
    .maybeSingle()

  if (error) {
    console.error("Error checking duplicate Fillout channel application:", error)
    return { error: error.message as string }
  }

  return { row: data }
}

export async function registerChannelApplication(
  input: ChannelApplicationInput,
): Promise<ChannelApplicationRegistrationResult> {
  const applicantEmail = normalizeEmail(input.applicantEmail)
  if (!isValidEmail(applicantEmail)) {
    return { ok: false, error: "A valid applicant email is required.", status: 400 }
  }

  const channelName = input.channelName.trim()
  if (!channelName) {
    return { ok: false, error: "Channel name is required.", status: 400 }
  }

  const description = input.description.trim() || channelName
  const filloutSubmissionId = input.filloutSubmissionId?.trim() || null
  const handleInput = input.handle?.trim()
  const handle = handleInput
    ? normalizeChannelHandle(handleInput)
    : channelHandleFromName(channelName)

  if (handle.length < 2) {
    return { ok: false, error: "Channel handle must be at least 2 characters.", status: 400 }
  }

  const application: ChannelApplicationPayload = {
    name: channelName,
    description,
    handle,
    applicantEmail,
    applicantName: input.applicantName?.trim() || undefined,
    filloutSubmissionId: filloutSubmissionId ?? undefined,
    message: input.payload?.message ?? undefined,
    organization: input.payload?.organization ?? undefined,
    website: input.payload?.website ?? undefined,
    source: input.source ?? input.payload?.source ?? "webhook",
  }

  if (filloutSubmissionId) {
    const existing = await findExistingByFilloutSubmissionId(filloutSubmissionId)
    if ("error" in existing && existing.error) {
      return { ok: false, error: existing.error, status: 500 }
    }
    if (existing.row) {
      return {
        ok: true,
        channelId: existing.row.id,
        status: existing.row.status as ChannelStatus,
        created: false,
      }
    }
  }

  const applicantUserId = input.applicantUserId ?? (await findUserIdByEmail(applicantEmail))
  const admin = createAdminSupabaseClient()

  const { data: inserted, error: insertError } = await admin
    .from("categories")
    .insert({
      name: channelName,
      description,
      handle,
      channel_type: "user",
      status: "pending_review",
      owner_id: applicantUserId,
      is_active: false,
      is_verified: false,
      sort_order: 9990,
      application,
      updated_at: new Date().toISOString(),
    })
    .select("id, status")
    .single()

  if (insertError || !inserted) {
    if (insertError?.code === "23505") {
      const duplicatePending = insertError.message?.includes("categories_one_pending_application_per_owner")
      return {
        ok: false,
        error: duplicatePending
          ? "You already have a channel application under review."
          : "A channel with that name or handle already exists.",
        status: 409,
      }
    }
    console.error("Error inserting channel application:", insertError)
    return { ok: false, error: insertError?.message ?? "Could not save application.", status: 500 }
  }

  return {
    ok: true,
    channelId: inserted.id,
    status: inserted.status as ChannelStatus,
    created: true,
  }
}
