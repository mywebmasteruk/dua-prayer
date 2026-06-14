"use server"

import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { requirePermission } from "@/lib/auth"
import {
  channelHandleFromName,
  normalizeChannelHandle,
  type ChannelApplicationPayload,
  type ChannelStatus,
  type ChannelType,
} from "@/lib/channel-types"
import type { Category } from "@/lib/types/dua"

export type AdminChannelRecord = Category & {
  application: ChannelApplicationPayload | null
  duaCount: number
}

type AdminChannelApplicationInput = {
  applicantEmail?: string
  applicantName?: string
  organization?: string
  website?: string
  message?: string
  source?: string
}

type AdminChannelMutationInput = AdminChannelApplicationInput & {
  name: string
  description: string
  handle?: string
  channelType?: ChannelType
  status?: ChannelStatus
  isActive?: boolean
  isVerified?: boolean
  sortOrder?: number
}

function optionalTrim(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
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
    channelType: typeof record.channelType === "string" ? record.channelType : undefined,
    socialMediaLink: typeof record.socialMediaLink === "string" ? record.socialMediaLink : undefined,
    location: typeof record.location === "string" ? record.location : undefined,
    languages: typeof record.languages === "string" ? record.languages : undefined,
    registrationNumber:
      typeof record.registrationNumber === "string" ? record.registrationNumber : undefined,
    role: typeof record.role === "string" ? record.role : undefined,
    agreedToTerms: typeof record.agreedToTerms === "boolean" ? record.agreedToTerms : undefined,
  }
}

function buildApplicationPayload(
  input: AdminChannelApplicationInput & {
    name: string
    description: string
    handle?: string | null
    existing?: ChannelApplicationPayload | null
  },
): ChannelApplicationPayload {
  return {
    filloutSubmissionId: input.existing?.filloutSubmissionId,
    name: input.name,
    description: input.description,
    handle: input.handle ?? undefined,
    applicantEmail:
      input.applicantEmail === undefined ? input.existing?.applicantEmail : optionalTrim(input.applicantEmail),
    applicantName:
      input.applicantName === undefined ? input.existing?.applicantName : optionalTrim(input.applicantName),
    organization:
      input.organization === undefined ? input.existing?.organization : optionalTrim(input.organization),
    website: input.website === undefined ? input.existing?.website : optionalTrim(input.website),
    message: input.message === undefined ? input.existing?.message : optionalTrim(input.message),
    source:
      input.source === undefined
        ? (input.existing?.source ?? "manual-admin")
        : (optionalTrim(input.source) ?? "manual-admin"),
    // Applicant-submitted metadata (from the Fillout webhook) — preserved as-is.
    channelType: input.existing?.channelType,
    socialMediaLink: input.existing?.socialMediaLink,
    location: input.existing?.location,
    languages: input.existing?.languages,
    registrationNumber: input.existing?.registrationNumber,
    role: input.existing?.role,
    agreedToTerms: input.existing?.agreedToTerms,
  }
}

function mapAdminChannelRow(channel: {
  id: number
  name: string
  description: string
  is_active: boolean
  sort_order: number
  channel_type?: "category" | "user" | null
  status?: "approved" | "pending_review" | "rejected" | null
  owner_id?: string | null
  handle?: string | null
  is_verified?: boolean | null
  verified_at?: string | null
  reviewed_at?: string | null
  reviewed_by?: string | null
  application?: unknown
  created_at: string
  updated_at: string
}): Category & { application: ChannelApplicationPayload | null } {
  return {
    id: channel.id,
    name: channel.name,
    description: channel.description,
    is_active: channel.is_active,
    sort_order: channel.sort_order,
    channel_type: channel.channel_type === "user" ? "user" : "category",
    status:
      channel.status === "pending_review" || channel.status === "rejected"
        ? channel.status
        : "approved",
    owner_id: channel.owner_id ?? null,
    handle: channel.handle ?? null,
    is_verified: channel.is_verified ?? channel.channel_type !== "user",
    verified_at: channel.verified_at ?? null,
    reviewed_at: channel.reviewed_at ?? null,
    reviewed_by: channel.reviewed_by ?? null,
    application: parseApplication(channel.application),
    created_at: channel.created_at,
    updated_at: channel.updated_at,
  }
}

export async function listAdminChannels(): Promise<{ channels: AdminChannelRecord[] } | { error: string }> {
  const gate = await requirePermission("manage_channels")
  if (!gate.ok) return { error: gate.error === "Forbidden" ? "You cannot manage channels." : "Unauthorized" }

  const admin = createAdminSupabaseClient()
  const fullSelect =
    "id, name, description, is_active, sort_order, channel_type, status, owner_id, handle, is_verified, verified_at, reviewed_at, reviewed_by, application, created_at, updated_at"

  type ChannelRow = Parameters<typeof mapAdminChannelRow>[0]

  let channelRows: ChannelRow[] = []
  const modern = await admin
    .from("categories")
    .select(fullSelect)
    .eq("status", "approved")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })

  if (modern.error?.code === "42703") {
    const legacy = await admin
      .from("categories")
      .select("id, name, description, is_active, sort_order, created_at, updated_at")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })

    if (legacy.error) {
      console.error("Error listing channels:", legacy.error)
      return { error: legacy.error.message }
    }

    channelRows = (legacy.data ?? []) as ChannelRow[]
  } else if (modern.error) {
    console.error("Error listing channels:", modern.error)
    return { error: modern.error.message }
  } else {
    channelRows = (modern.data ?? []) as ChannelRow[]
  }

  const ids = channelRows.map((c) => c.id)
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

  return {
    channels: channelRows.map((channel) => ({
      ...mapAdminChannelRow(channel),
      duaCount: counts.get(channel.id) ?? 0,
    })),
  }
}

export async function createChannel(input: AdminChannelMutationInput) {
  const gate = await requirePermission("manage_channels")
  if (!gate.ok) return { error: gate.error === "Forbidden" ? "You cannot manage channels." : "Unauthorized" }

  const name = input.name.trim()
  const description = input.description.trim()
  if (!name) return { error: "Channel name is required." }
  if (!description) return { error: "Channel description is required." }

  const handleInput = optionalTrim(input.handle)
  const handle = handleInput ? normalizeChannelHandle(handleInput) : channelHandleFromName(name)
  if (handle.length < 2) return { error: "Channel handle must be at least 2 characters." }

  const admin = createAdminSupabaseClient()
  const { data: maxRow } = await admin
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const channelType = input.channelType ?? "category"
  const status = input.status ?? "approved"
  const now = new Date().toISOString()
  const sortOrder = input.sortOrder ?? (maxRow?.sort_order ?? 0) + 10
  const isVerified = input.isVerified ?? channelType === "category"
  const application = buildApplicationPayload({ ...input, name, description, handle })

  const { error } = await admin.from("categories").insert({
    name,
    description,
    handle,
    channel_type: channelType,
    status,
    is_active: input.isActive ?? status === "approved",
    is_verified: isVerified,
    verified_at: isVerified ? now : null,
    reviewed_at: status === "pending_review" ? null : now,
    reviewed_by: status === "pending_review" ? null : gate.user.id,
    application,
    sort_order: sortOrder,
    updated_at: now,
  })

  if (error) {
    if (error.code === "23505") return { error: "A channel with that name or handle already exists." }
    return { error: error.message }
  }

  revalidatePath("/admin/channels")
  revalidatePath("/channels")
  revalidatePath("/")
  return { success: true as const }
}

export async function updateChannel(input: Partial<AdminChannelMutationInput> & { id: number }) {
  const gate = await requirePermission("manage_channels")
  if (!gate.ok) return { error: gate.error === "Forbidden" ? "You cannot manage channels." : "Unauthorized" }

  const admin = createAdminSupabaseClient()
  const { data: existing, error: loadError } = await admin
    .from("categories")
    .select("name, description, handle, channel_type, status, is_verified, application")
    .eq("id", input.id)
    .single()

  if (loadError || !existing) return { error: loadError?.message ?? "Channel not found." }

  const name = input.name !== undefined ? input.name.trim() : existing.name
  const description = input.description !== undefined ? input.description.trim() : existing.description
  if (!name) return { error: "Channel name cannot be empty." }
  if (!description) return { error: "Channel description cannot be empty." }

  const handle =
    input.handle !== undefined
      ? optionalTrim(input.handle)
        ? normalizeChannelHandle(input.handle)
        : null
      : existing.handle
  if (handle !== null && handle.length < 2) return { error: "Channel handle must be at least 2 characters." }

  const nextStatus = input.status ?? existing.status
  const nextChannelType = input.channelType ?? existing.channel_type
  const nextIsVerified = input.isVerified ?? existing.is_verified
  const now = new Date().toISOString()
  const application = buildApplicationPayload({
    existing: parseApplication(existing.application),
    name,
    description,
    handle,
    applicantEmail: input.applicantEmail,
    applicantName: input.applicantName,
    organization: input.organization,
    website: input.website,
    message: input.message,
    source: input.source,
  })

  const updates: {
    updated_at: string
    name: string
    description: string
    handle: string | null
    channel_type: ChannelType
    status: ChannelStatus
    is_verified: boolean
    verified_at?: string | null
    reviewed_at?: string | null
    reviewed_by?: string | null
    application: ChannelApplicationPayload
    is_active?: boolean
    sort_order?: number
  } = {
    updated_at: now,
    name,
    description,
    handle,
    channel_type: nextChannelType,
    status: nextStatus,
    is_verified: nextIsVerified,
    application,
  }

  if (input.isActive !== undefined) updates.is_active = input.isActive
  if (input.sortOrder !== undefined) updates.sort_order = input.sortOrder
  if (nextIsVerified && !existing.is_verified) updates.verified_at = now
  if (!nextIsVerified) updates.verified_at = null
  if (input.status !== undefined && nextStatus !== "pending_review") {
    updates.reviewed_at = now
    updates.reviewed_by = gate.user.id
  }

  const { error } = await admin.from("categories").update(updates).eq("id", input.id)

  if (error) {
    if (error.code === "23505") return { error: "A channel with that name or handle already exists." }
    return { error: error.message }
  }

  revalidatePath("/admin/channels")
  revalidatePath("/channels")
  revalidatePath("/")
  return { success: true as const }
}

export async function deleteChannel(channelId: number) {
  const gate = await requirePermission("manage_channels")
  if (!gate.ok) return { error: gate.error === "Forbidden" ? "You cannot manage channels." : "Unauthorized" }

  const admin = createAdminSupabaseClient()
  const { count, error: countError } = await admin
    .from("duas")
    .select("id", { count: "exact", head: true })
    .eq("category_id", channelId)

  if (countError) return { error: countError.message }
  if ((count ?? 0) > 0) {
    return { error: "This channel has duas attached. Deactivate it instead of deleting." }
  }

  const { error } = await admin.from("categories").delete().eq("id", channelId)
  if (error) return { error: error.message }

  revalidatePath("/admin/channels")
  revalidatePath("/")
  return { success: true as const }
}

export async function reorderChannels(orderedIds: number[]) {
  const gate = await requirePermission("manage_channels")
  if (!gate.ok) return { error: gate.error === "Forbidden" ? "You cannot manage channels." : "Unauthorized" }

  const admin = createAdminSupabaseClient()
  const now = new Date().toISOString()

  for (let index = 0; index < orderedIds.length; index += 1) {
    const { error } = await admin
      .from("categories")
      .update({ sort_order: (index + 1) * 10, updated_at: now })
      .eq("id", orderedIds[index])

    if (error) return { error: error.message }
  }

  revalidatePath("/admin/channels")
  revalidatePath("/")
  return { success: true as const }
}
