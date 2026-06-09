"use server"

import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { requirePermission } from "@/lib/auth"
import type { Category } from "@/lib/types/dua"

export type AdminChannelRecord = Category & {
  duaCount: number
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
  created_at: string
  updated_at: string
}): Category {
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
    created_at: channel.created_at,
    updated_at: channel.updated_at,
  }
}

export async function listAdminChannels(): Promise<{ channels: AdminChannelRecord[] } | { error: string }> {
  const gate = await requirePermission("manage_channels")
  if (!gate.ok) return { error: gate.error === "Forbidden" ? "You cannot manage channels." : "Unauthorized" }

  const admin = createAdminSupabaseClient()
  const fullSelect =
    "id, name, description, is_active, sort_order, channel_type, status, owner_id, handle, is_verified, verified_at, reviewed_at, reviewed_by, created_at, updated_at"

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

export async function createChannel(input: {
  name: string
  description: string
  isActive?: boolean
  sortOrder?: number
}) {
  const gate = await requirePermission("manage_channels")
  if (!gate.ok) return { error: gate.error === "Forbidden" ? "You cannot manage channels." : "Unauthorized" }

  const name = input.name.trim()
  const description = input.description.trim()
  if (!name) return { error: "Channel name is required." }
  if (!description) return { error: "Channel description is required." }

  const admin = createAdminSupabaseClient()
  const { data: maxRow } = await admin
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const sortOrder = input.sortOrder ?? (maxRow?.sort_order ?? 0) + 10

  const { error } = await admin.from("categories").insert({
    name,
    description,
    channel_type: "category",
    status: "approved",
    is_active: input.isActive ?? true,
    is_verified: true,
    verified_at: new Date().toISOString(),
    sort_order: sortOrder,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    if (error.code === "23505") return { error: "A channel with that name already exists." }
    return { error: error.message }
  }

  revalidatePath("/admin/channels")
  revalidatePath("/")
  return { success: true as const }
}

export async function updateChannel(input: {
  id: number
  name?: string
  description?: string
  isActive?: boolean
  sortOrder?: number
}) {
  const gate = await requirePermission("manage_channels")
  if (!gate.ok) return { error: gate.error === "Forbidden" ? "You cannot manage channels." : "Unauthorized" }

  const updates: {
    updated_at: string
    name?: string
    description?: string
    is_active?: boolean
    sort_order?: number
  } = { updated_at: new Date().toISOString() }

  if (input.name !== undefined) {
    const name = input.name.trim()
    if (!name) return { error: "Channel name cannot be empty." }
    updates.name = name
  }
  if (input.description !== undefined) {
    const description = input.description.trim()
    if (!description) return { error: "Channel description cannot be empty." }
    updates.description = description
  }
  if (input.isActive !== undefined) updates.is_active = input.isActive
  if (input.sortOrder !== undefined) updates.sort_order = input.sortOrder

  const admin = createAdminSupabaseClient()
  const { error } = await admin.from("categories").update(updates).eq("id", input.id)

  if (error) {
    if (error.code === "23505") return { error: "A channel with that name already exists." }
    return { error: error.message }
  }

  revalidatePath("/admin/channels")
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
