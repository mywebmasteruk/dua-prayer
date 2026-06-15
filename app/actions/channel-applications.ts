"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { listAllAuthUsers } from "@/lib/auth-users"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getServerUser } from "@/lib/server-user"
import { requirePermission } from "@/lib/auth"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { verifyTurnstile } from "@/lib/turnstile"
import { getChannelFormRegistry } from "@/lib/site-settings-server"
import { registerChannelApplication } from "@/lib/channel-applications"
import { validateAnswers } from "@/lib/form-fields"
import { HONEYPOT_FIELD, TURNSTILE_FIELD, boundString, readAnswersFromFormData, stringAnswer } from "@/lib/form-submit"
import {
  CHANNEL_STATUS_LABELS,
  type ChannelApplicationPayload,
  type ChannelStatus,
} from "@/lib/channel-types"
import type { Category } from "@/lib/types/dua"

export type ChannelApplicationRecord = Category & {
  applicantEmail: string
  applicantName: string | null
  duaCount: number
  application: ChannelApplicationPayload | null
}

async function listAuthEmails(): Promise<Map<string, string>> {
  const { users, error } = await listAllAuthUsers()
  if (error) console.error("Error listing auth users for channel applications:", error)
  return new Map(users.filter((user) => user.email).map((user) => [user.id, user.email as string]))
}

function parseApplication(value: unknown): ChannelApplicationPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  if (typeof record.name !== "string" || typeof record.description !== "string") return null
  return {
    name: record.name,
    description: record.description,
    handle: typeof record.handle === "string" ? record.handle : undefined,
    message: typeof record.message === "string" ? record.message : undefined,
    applicantEmail: typeof record.applicantEmail === "string" ? record.applicantEmail : undefined,
    applicantName: typeof record.applicantName === "string" ? record.applicantName : undefined,
    filloutSubmissionId:
      typeof record.filloutSubmissionId === "string" ? record.filloutSubmissionId : undefined,
    organization: typeof record.organization === "string" ? record.organization : undefined,
    website: typeof record.website === "string" ? record.website : undefined,
    source: typeof record.source === "string" ? record.source : undefined,
    fields:
      record.fields && typeof record.fields === "object" && !Array.isArray(record.fields)
        ? (record.fields as ChannelApplicationPayload["fields"])
        : undefined,
  }
}

function mapCategoryRow(row: {
  id: number
  name: string
  description: string
  is_active: boolean
  sort_order: number
  channel_type: "category" | "user"
  status: ChannelStatus
  owner_id: string | null
  handle: string | null
  is_verified: boolean
  verified_at: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  created_at: string
  updated_at: string
}): Category {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    is_active: row.is_active,
    sort_order: row.sort_order,
    channel_type: row.channel_type,
    status: row.status,
    owner_id: row.owner_id,
    handle: row.handle,
    is_verified: row.is_verified,
    verified_at: row.verified_at,
    reviewed_at: row.reviewed_at,
    reviewed_by: row.reviewed_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function listChannelApplications(input?: {
  status?: ChannelStatus
}): Promise<{ applications: ChannelApplicationRecord[] } | { error: string }> {
  const gate = await requirePermission("manage_channels")
  if (!gate.ok) return { error: gate.error === "Forbidden" ? "You cannot manage channels." : "Unauthorized" }

  const admin = createAdminSupabaseClient()
  let query = admin
    .from("categories")
    .select(
      "id, name, description, is_active, sort_order, channel_type, status, owner_id, handle, is_verified, verified_at, reviewed_at, reviewed_by, application, created_at, updated_at",
    )
    .eq("channel_type", "user")
    .order("created_at", { ascending: false })

  if (input?.status) {
    query = query.eq("status", input.status)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error listing channel applications:", error)
    return { error: error.message }
  }

  const emails = await listAuthEmails()
  const ownerIds = [...new Set((data ?? []).map((row) => row.owner_id).filter(Boolean))] as string[]
  const displayNames = new Map<string, string | null>()

  if (ownerIds.length > 0) {
    const { data: profiles, error: profileError } = await admin
      .from("profiles")
      .select("id, display_name")
      .in("id", ownerIds)

    if (profileError) console.error("Error loading channel applicant profiles:", profileError)
    else {
      for (const profile of profiles ?? []) {
        displayNames.set(profile.id, profile.display_name)
      }
    }
  }
  const ids = (data ?? []).map((row) => row.id)
  const counts = new Map<number, number>()

  if (ids.length > 0) {
    const { data: duas, error: duaError } = await admin.from("duas").select("category_id").in("category_id", ids)
    if (duaError) console.error("Error counting channel duas:", duaError)
    else {
      for (const row of duas ?? []) {
        if (!row.category_id) continue
        counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1)
      }
    }
  }

  const applications: ChannelApplicationRecord[] = (data ?? []).map((row) => {
    const ownerId = row.owner_id ?? ""
    const application = parseApplication(row.application)
    return {
      ...mapCategoryRow({
        id: row.id,
        name: row.name,
        description: row.description,
        is_active: row.is_active,
        sort_order: row.sort_order,
        channel_type: row.channel_type,
        status: row.status,
        owner_id: row.owner_id,
        handle: row.handle,
        is_verified: row.is_verified,
        verified_at: row.verified_at,
        reviewed_at: row.reviewed_at,
        reviewed_by: row.reviewed_by,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }),
      applicantEmail: emails.get(ownerId) ?? application?.applicantEmail ?? "",
      applicantName: ownerId
        ? (displayNames.get(ownerId) ?? application?.applicantName ?? null)
        : (application?.applicantName ?? null),
      duaCount: counts.get(row.id) ?? 0,
      application,
    }
  })

  return { applications }
}

export async function reviewChannelApplication(input: {
  channelId: number
  decision: "approve" | "reject"
}) {
  const gate = await requirePermission("manage_channels")
  if (!gate.ok) return { error: gate.error === "Forbidden" ? "You cannot manage channels." : "Unauthorized" }

  const admin = createAdminSupabaseClient()
  const { data: channel, error: loadError } = await admin
    .from("categories")
    .select("id, channel_type, status")
    .eq("id", input.channelId)
    .single()

  if (loadError || !channel) {
    return { error: loadError?.message ?? "Application not found." }
  }

  if (channel.channel_type !== "user") {
    return { error: "Only community channel applications can be reviewed here." }
  }

  if (channel.status !== "pending_review") {
    return { error: "This application is no longer pending review." }
  }

  const now = new Date().toISOString()
  const reviewerId = gate.user.id

  if (input.decision === "reject") {
    const { error } = await admin
      .from("categories")
      .update({
        status: "rejected",
        is_active: false,
        is_verified: false,
        verified_at: null,
        reviewed_at: now,
        reviewed_by: reviewerId,
        updated_at: now,
      })
      .eq("id", input.channelId)

    if (error) return { error: error.message }

    revalidatePath("/admin/channels")
    revalidatePath("/channels")
    revalidatePath("/")
    return { success: true as const, status: CHANNEL_STATUS_LABELS.rejected }
  }

  const { data: maxRow } = await admin
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const sortOrder = (maxRow?.sort_order ?? 0) + 10

  const { error } = await admin
    .from("categories")
    .update({
      status: "approved",
      is_active: true,
      is_verified: true,
      verified_at: now,
      reviewed_at: now,
      reviewed_by: reviewerId,
      sort_order: sortOrder,
      updated_at: now,
    })
    .eq("id", input.channelId)

  if (error) return { error: error.message }

  revalidatePath("/admin/channels")
  revalidatePath("/channels")
  revalidatePath("/")
  return { success: true as const, status: CHANNEL_STATUS_LABELS.approved }
}

export async function getMyPendingChannelApplication(): Promise<
  { application: Category | null } | { error: string }
> {
  const user = await getServerUser()

  if (!user) return { application: null }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("categories")
    .select(
      "id, name, description, is_active, sort_order, channel_type, status, owner_id, handle, is_verified, verified_at, reviewed_at, reviewed_by, created_at, updated_at",
    )
    .eq("owner_id", user.id)
    .eq("status", "pending_review")
    .maybeSingle()

  if (error) {
    if (error.code === "42703") return { application: null }
    return { error: error.message }
  }

  if (!data) return { application: null }

  return {
    application: mapCategoryRow({
      ...data,
      channel_type: data.channel_type === "user" ? "user" : "category",
      status: data.status as ChannelStatus,
    }),
  }
}

export type SubmitApplicationResult = { success: true; status: ChannelStatus } | { error: string }

/** Public, signed-in channel application submit from the built-in dynamic form. */
export async function submitChannelApplication(formData: FormData): Promise<SubmitApplicationResult> {
  const ip = getClientIp(await headers())
  if (!checkRateLimit(`channel-apply:${ip}`, 5).allowed) {
    return { error: "Too many submissions. Please wait a moment." }
  }
  if (formData.get(HONEYPOT_FIELD)) return { error: "Submission rejected" }
  if (!(await verifyTurnstile(formData.get(TURNSTILE_FIELD) as string, ip))) {
    return { error: "Bot verification failed. Please try again." }
  }

  // Channel applications require a verified session — owner_id is linked to the
  // signed-in user (safe, unlike an attacker-controlled webhook email).
  const user = await getServerUser()
  if (!user) return { error: "Please sign in to apply." }

  const pending = await getMyPendingChannelApplication()
  if ("error" in pending) return { error: pending.error }
  if (pending.application) return { error: "You already have a channel application under review." }

  const registry = await getChannelFormRegistry()
  const answers = readAnswersFromFormData(registry, formData)

  const validation = validateAnswers(registry, answers)
  if (!validation.ok) {
    return { error: Object.values(validation.errors)[0] ?? "Please complete the required fields." }
  }

  const channelName = boundString(registry, answers, "channelName")
  const email = boundString(registry, answers, "email") ?? user.email ?? null
  if (!channelName) return { error: "Channel name is required." }
  if (!email) return { error: "Email is required." }

  const result = await registerChannelApplication({
    channelName,
    description: boundString(registry, answers, "description") ?? "",
    applicantEmail: email,
    applicantName: boundString(registry, answers, "applicantName"),
    handle: boundString(registry, answers, "handle"),
    applicantUserId: user.id,
    source: "in-app",
    payload: {
      fields: answers,
      message: stringAnswer(answers, "message"),
      organization: stringAnswer(answers, "organization"),
      website: stringAnswer(answers, "website"),
    },
  })

  if (!result.ok) return { error: result.error }

  revalidatePath("/channels/apply")
  revalidatePath("/admin/channels")
  return { success: true, status: result.status }
}
