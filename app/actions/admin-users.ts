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

export type AppUserRecord = {
  id: string
  email: string
  displayName: string | null
  isAdmin: boolean
  roleLabel: string
  adminRole: AdminRoleType | null
  isFoundingAdmin: boolean
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
    .select("id, display_name, is_admin, admin_role, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error listing profiles:", error)
    return { error: error.message }
  }

  const authUsers = await listAllAuthUsers()

  const ids = (profiles ?? []).map((p) => p.id)
  const duaCounts = new Map<string, number>()

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
    return { error: "The super admin role is fixed by SUPER_ADMIN_EMAIL and cannot be changed here." }
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
  revalidatePath("/admin/settings/roles")
  revalidatePath("/admin")
  return { success: true as const }
}
