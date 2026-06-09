"use server"

import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import {
  ADMIN_PERMISSIONS,
  ASSIGNABLE_ADMIN_ROLES,
  type AdminPermission,
  type AdminPermissionOverrides,
  type AdminRoleType,
  resolvePermissions,
} from "@/lib/admin-permissions"
import {
  getAdminContext,
  getFoundingAdminEmail,
  hasPermission,
  isFoundingAdminUser,
  requirePermission,
} from "@/lib/auth"

export type AdminUserRecord = {
  id: string
  email: string
  displayName: string | null
  isFoundingAdmin: boolean
  role: AdminRoleType | null
  permissions: AdminPermission[]
  permissionOverrides: AdminPermissionOverrides
}

async function listAuthUsersByIds(ids: string[]): Promise<Map<string, { email: string }>> {
  const admin = createAdminSupabaseClient()
  const map = new Map<string, { email: string }>()

  if (ids.length === 0) return map

  let page = 1
  const perPage = 200
  const idSet = new Set(ids)

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) {
      console.error("Error listing auth users:", error)
      break
    }

    for (const user of data.users) {
      if (idSet.has(user.id) && user.email) {
        map.set(user.id, { email: user.email })
      }
    }

    if (map.size >= idSet.size || data.users.length < perPage) break
    page += 1
  }

  return map
}

function parseOverrides(raw: unknown): AdminPermissionOverrides {
  const overrides: AdminPermissionOverrides = {}
  if (!raw || typeof raw !== "object") return overrides

  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if ((ADMIN_PERMISSIONS as readonly string[]).includes(key) && typeof value === "boolean") {
      overrides[key as AdminPermission] = value
    }
  }
  return overrides
}

function canViewAdminRoles(ctx: NonNullable<Awaited<ReturnType<typeof getAdminContext>>>) {
  return (
    ctx.isFoundingAdmin ||
    hasPermission(ctx, "manage_admins") ||
    hasPermission(ctx, "manage_users")
  )
}

export async function getCurrentAdminAccess() {
  const ctx = await getAdminContext()

  if (!ctx || !canViewAdminRoles(ctx)) {
    return {
      currentUser: null,
      canManageAdmins: false,
      permissions: [] as AdminPermission[],
      isFoundingAdmin: false,
      role: null as AdminRoleType | null,
    }
  }

  return {
    currentUser: {
      email: ctx.user.email ?? "",
      displayName: ctx.displayName,
      isFoundingAdmin: ctx.isFoundingAdmin,
      role: ctx.role,
      permissions: ctx.permissions,
    },
    canManageAdmins: ctx.isFoundingAdmin || ctx.permissions.includes("manage_admins"),
    permissions: ctx.permissions,
    isFoundingAdmin: ctx.isFoundingAdmin,
    role: ctx.role,
  }
}

export async function listAdminUsers(): Promise<{ admins: AdminUserRecord[] } | { error: string }> {
  const ctx = await getAdminContext()
  if (!ctx) return { error: "Unauthorized" }
  if (!canViewAdminRoles(ctx)) return { error: "You cannot view admin roles." }

  const admin = createAdminSupabaseClient()
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, display_name, is_admin, admin_role, admin_permissions")
    .eq("is_admin", true)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error listing admin profiles:", error)
    return { error: error.message }
  }

  const ids = (profiles ?? []).map((p) => p.id)
  const authUsers = await listAuthUsersByIds(ids)

  const admins: AdminUserRecord[] = (profiles ?? []).map((profile) => {
    const email = authUsers.get(profile.id)?.email ?? ""
    const isFounding = isFoundingAdminUser({ email })
    const overrides = parseOverrides(profile.admin_permissions)
    const role = (profile.admin_role as AdminRoleType | null) ?? "admin"
    const permissions = isFounding ? [...ADMIN_PERMISSIONS] : resolvePermissions(role, overrides)

    return {
      id: profile.id,
      email,
      displayName: profile.display_name,
      isFoundingAdmin: isFounding,
      role,
      permissions,
      permissionOverrides: overrides,
    }
  })

  return { admins }
}

export async function assignAdminRole(input: {
  email: string
  role: AdminRoleType
  permissionOverrides?: AdminPermissionOverrides
}) {
  const gate = await requirePermission("manage_admins")
  if (!gate.ok) return { error: gate.error === "Forbidden" ? "Only the founding admin can assign roles." : "Unauthorized" }

  const email = input.email.trim().toLowerCase()
  if (!email) return { error: "Email is required" }

  if (!ASSIGNABLE_ADMIN_ROLES.includes(input.role as (typeof ASSIGNABLE_ADMIN_ROLES)[number])) {
    return { error: "Volunteer helper tiers are assigned from Admin → Volunteers → Roles." }
  }

  const founderEmail = getFoundingAdminEmail()
  if (founderEmail && email === founderEmail) {
    return { error: "The super admin role is fixed by SUPER_ADMIN_EMAIL and cannot be changed here." }
  }

  const admin = createAdminSupabaseClient()

  let targetUserId: string | null = null
  let page = 1
  while (!targetUserId) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) return { error: error.message }
    const match = data.users.find((u) => u.email?.toLowerCase() === email)
    if (match) {
      targetUserId = match.id
      break
    }
    if (data.users.length < 200) break
    page += 1
  }

  if (!targetUserId) {
    return { error: "No account found with that email. They must sign up first." }
  }

  const overrides: AdminPermissionOverrides = {}
  if (input.permissionOverrides) {
    for (const [key, value] of Object.entries(input.permissionOverrides)) {
      if ((ADMIN_PERMISSIONS as readonly string[]).includes(key) && key !== "manage_admins" && typeof value === "boolean") {
        overrides[key as AdminPermission] = value
      }
    }
  }

  const { error: upsertError } = await admin.from("profiles").upsert(
    {
      id: targetUserId,
      is_admin: true,
      admin_role: input.role,
      admin_permissions: overrides,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  )

  if (upsertError) return { error: upsertError.message }

  revalidatePath("/admin/settings/roles")
  revalidatePath("/admin/users/roles")
  revalidatePath("/admin")
  return { success: true as const }
}

export async function revokeAdminAccess(userId: string) {
  const gate = await requirePermission("manage_admins")
  if (!gate.ok) return { error: gate.error === "Forbidden" ? "Only the founding admin can revoke access." : "Unauthorized" }

  const admin = createAdminSupabaseClient()
  const authUsers = await listAuthUsersByIds([userId])
  const email = authUsers.get(userId)?.email
  if (email && isFoundingAdminUser({ email })) {
    return { error: "The founding admin cannot be demoted." }
  }

  const { error } = await admin
    .from("profiles")
    .update({
      is_admin: false,
      admin_role: null,
      admin_permissions: {},
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (error) return { error: error.message }

  revalidatePath("/admin/settings/roles")
  revalidatePath("/admin/users/roles")
  revalidatePath("/admin")
  return { success: true as const }
}
