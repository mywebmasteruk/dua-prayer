"use server"

import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { getFoundingAdminEmail, isFoundingAdminUser, requirePermission } from "@/lib/auth"
import {
  ADMIN_ROLE_LABELS,
  SUPER_ADMIN_ROLE_LABEL,
  USER_ROLE_LABEL,
  type AdminRoleType,
} from "@/lib/admin-permissions"
import type { MemberRole } from "@/lib/volunteer-types"

export type AppUserRecord = {
  id: string
  email: string
  displayName: string | null
  isAdmin: boolean
  roleLabel: string
  adminRole: AdminRoleType | null
  isFoundingAdmin: boolean
  memberRole: MemberRole | null
  hasVolunteerApplication: boolean
  /** True when the user owns an approved community channel (`categories.owner_id`). */
  isChannelAdmin: boolean
  duaCount: number
  createdAt: string
}

async function listAllAuthUsers(): Promise<Map<string, { email: string; createdAt: string }>> {
  const admin = createAdminSupabaseClient()
  const map = new Map<string, { email: string; createdAt: string }>()

  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) {
      console.error("Error listing auth users:", error)
      break
    }

    for (const user of data.users) {
      if (user.email) {
        map.set(user.id, { email: user.email, createdAt: user.created_at })
      }
    }

    if (data.users.length < perPage) break
    page += 1
  }

  return map
}

function roleLabelForUser(input: {
  email: string
  isAdmin: boolean
  adminRole: AdminRoleType | null
}): string {
  if (isFoundingAdminUser({ email: input.email })) return SUPER_ADMIN_ROLE_LABEL
  if (!input.isAdmin) return USER_ROLE_LABEL
  return input.adminRole ? ADMIN_ROLE_LABELS[input.adminRole] : "Admin"
}

export async function listAppUsers(): Promise<{ users: AppUserRecord[] } | { error: string }> {
  const gate = await requirePermission("manage_users")
  if (!gate.ok) return { error: gate.error === "Forbidden" ? "You cannot manage users." : "Unauthorized" }

  const admin = createAdminSupabaseClient()
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, display_name, is_admin, admin_role, member_role, volunteer_application, created_at")
    .eq("account_status", "active")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error listing profiles:", error)
    return { error: error.message }
  }

  const authUsers = await listAllAuthUsers()

  const ids = (profiles ?? []).map((p) => p.id)
  const duaCounts = new Map<string, number>()
  const channelAdminIds = new Set<string>()

  if (ids.length > 0) {
    const { data: duaRows, error: duaError } = await admin.from("duas").select("user_id").in("user_id", ids)
    if (duaError) {
      console.error("Error counting user duas:", duaError)
    } else {
      for (const row of duaRows ?? []) {
        if (!row.user_id) continue
        duaCounts.set(row.user_id, (duaCounts.get(row.user_id) ?? 0) + 1)
      }
    }

    const { data: ownedChannels, error: channelError } = await admin
      .from("categories")
      .select("owner_id")
      .in("owner_id", ids)
      .eq("channel_type", "user")
      .eq("status", "approved")

    if (channelError && channelError.code !== "42703") {
      console.error("Error loading channel owners:", channelError)
    } else {
      for (const row of ownedChannels ?? []) {
        if (row.owner_id) channelAdminIds.add(row.owner_id)
      }
    }
  }

  const users: AppUserRecord[] = (profiles ?? []).map((profile) => {
    const auth = authUsers.get(profile.id)
    const email = auth?.email ?? ""
    return {
      id: profile.id,
      email,
      displayName: profile.display_name,
      isAdmin: profile.is_admin === true,
      roleLabel: roleLabelForUser({
        email,
        isAdmin: profile.is_admin === true,
        adminRole: profile.admin_role,
      }),
      adminRole: profile.admin_role,
      isFoundingAdmin: isFoundingAdminUser({ email }),
      memberRole: profile.member_role,
      hasVolunteerApplication: profile.volunteer_application != null,
      isChannelAdmin: channelAdminIds.has(profile.id),
      duaCount: duaCounts.get(profile.id) ?? 0,
      createdAt: auth?.createdAt ?? profile.created_at,
    }
  })

  return { users }
}

export async function updateUserDisplayName(userId: string, displayName: string) {
  const gate = await requirePermission("manage_users")
  if (!gate.ok) return { error: gate.error === "Forbidden" ? "You cannot manage users." : "Unauthorized" }

  const trimmed = displayName.trim()
  if (!trimmed) return { error: "Display name cannot be empty." }

  const admin = createAdminSupabaseClient()
  const { error } = await admin
    .from("profiles")
    .update({ display_name: trimmed, updated_at: new Date().toISOString() })
    .eq("id", userId)

  if (error) return { error: error.message }

  revalidatePath("/admin/users")
  return { success: true as const }
}

export async function setUserRole(input: { userId: string; role: "user" | AdminRoleType }) {
  const gate = await requirePermission("manage_users")
  if (!gate.ok) return { error: gate.error === "Forbidden" ? "You cannot manage users." : "Unauthorized" }

  const admin = createAdminSupabaseClient()
  const authUsers = await listAllAuthUsers()
  const email = authUsers.get(input.userId)?.email ?? ""

  const founderEmail = getFoundingAdminEmail()
  if (founderEmail && email.toLowerCase() === founderEmail) {
    return { error: "The super admin role is fixed to webmaster@duaprayer.com and cannot be changed here." }
  }

  if (input.role === "user") {
    const { error } = await admin
      .from("profiles")
      .update({
        is_admin: false,
        admin_role: null,
        admin_permissions: {},
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.userId)

    if (error) return { error: error.message }
  } else {
    const { error } = await admin
      .from("profiles")
      .update({
        is_admin: true,
        admin_role: input.role,
        admin_permissions: {},
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.userId)

    if (error) return { error: error.message }
  }

  revalidatePath("/admin/users")
  revalidatePath("/admin/users/roles")
  revalidatePath("/admin/settings/roles")
  revalidatePath("/admin")
  return { success: true as const }
}

function deleteUserGuard(input: { userId: string; email: string; actorId: string }): { ok: true } | { error: string } {
  if (input.userId === input.actorId) {
    return { error: "You cannot delete your own account." }
  }

  if (isFoundingAdminUser({ email: input.email })) {
    return { error: "The platform founder account cannot be deleted." }
  }

  return { ok: true }
}

function revalidateAfterUserDelete() {
  revalidatePath("/admin/users")
  revalidatePath("/admin/volunteers")
  revalidatePath("/admin")
}

export async function deleteUser(userId: string) {
  const gate = await requirePermission("manage_users")
  if (!gate.ok) return { error: gate.error === "Forbidden" ? "You cannot manage users." : "Unauthorized" }

  const trimmedId = userId.trim()
  if (!trimmedId) return { error: "User id is required." }

  const authUsers = await listAllAuthUsers()
  const email = authUsers.get(trimmedId)?.email ?? ""

  const guard = deleteUserGuard({ userId: trimmedId, email, actorId: gate.user.id })
  if ("error" in guard) return guard

  const admin = createAdminSupabaseClient()
  const { error } = await admin.auth.admin.deleteUser(trimmedId)
  if (error) return { error: error.message }

  revalidateAfterUserDelete()
  return { success: true as const }
}

export async function deleteUsers(userIds: string[]) {
  const gate = await requirePermission("manage_users")
  if (!gate.ok) return { error: gate.error === "Forbidden" ? "You cannot manage users." : "Unauthorized" }

  const uniqueIds = [...new Set(userIds.map((id) => id.trim()).filter(Boolean))]
  if (uniqueIds.length === 0) return { error: "No users selected." }

  const authUsers = await listAllAuthUsers()
  const admin = createAdminSupabaseClient()

  let deletedCount = 0
  let failureCount = 0
  const deletedIds: string[] = []

  for (const userId of uniqueIds) {
    const email = authUsers.get(userId)?.email ?? ""
    const guard = deleteUserGuard({ userId, email, actorId: gate.user.id })
    if ("error" in guard) {
      failureCount += 1
      continue
    }

    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) {
      failureCount += 1
      continue
    }

    deletedCount += 1
    deletedIds.push(userId)
  }

  if (deletedCount > 0) revalidateAfterUserDelete()

  if (deletedCount === 0) {
    return { error: "No users could be deleted. You cannot remove yourself or the platform founder." }
  }

  return { success: true as const, deletedCount, failureCount, deletedIds }
}
