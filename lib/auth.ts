import { cache } from "react"
import type { User } from "@supabase/supabase-js"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { isFoundingAdminEmail, FOUNDING_ADMIN_EMAIL } from "@/lib/admin-policy"
import { getServerUser } from "@/lib/server-user"
import { signInHref } from "@/lib/auth-modal"
import {
  type AdminPermission,
  type AdminPermissionOverrides,
  type AdminRoleType,
  founderPermissions,
  isAdminPermission,
  resolvePermissions,
} from "@/lib/admin-permissions"

export function getFoundingAdminEmail(): string {
  return FOUNDING_ADMIN_EMAIL
}

export function isFoundingAdminUser(user: { email?: string | null }): boolean {
  return isFoundingAdminEmail(user.email)
}

/** @deprecated Prefer isFoundingAdminUser — alias for clarity in new code */
export const isFoundingAdmin = isFoundingAdminUser

export function isSuperAdminUser(user: { email?: string | null }): boolean {
  return isFoundingAdminUser(user)
}

type ProfileAdminFields = {
  is_admin: boolean
  admin_role: AdminRoleType | null
  admin_permissions: AdminPermissionOverrides
  display_name: string | null
}

async function getProfileAdminFields(userId: string): Promise<ProfileAdminFields | null> {
  try {
    let admin
    try {
      admin = createAdminSupabaseClient()
    } catch (error) {
      console.error("Admin profile lookup: Supabase admin client unavailable", error)
      return null
    }

    const { data, error } = await admin
      .from("profiles")
      .select("is_admin, admin_role, admin_permissions, display_name")
      .eq("id", userId)
      .single()

    if (error || !data) return null

    const overrides: AdminPermissionOverrides = {}
    if (data.admin_permissions && typeof data.admin_permissions === "object") {
      for (const [key, value] of Object.entries(data.admin_permissions as Record<string, unknown>)) {
        if (isAdminPermission(key) && typeof value === "boolean") {
          overrides[key] = value
        }
      }
    }

    return {
      is_admin: data.is_admin === true,
      admin_role: data.admin_role,
      admin_permissions: overrides,
      display_name: data.display_name,
    }
  } catch (error) {
    console.error("Admin profile lookup failed:", error)
    return null
  }
}

export type AdminContext = {
  user: User
  isFoundingAdmin: boolean
  /** Has access to at least one admin area */
  isAdmin: boolean
  role: AdminRoleType | null
  permissions: AdminPermission[]
  displayName: string | null
}

export const getAdminContext = cache(async (): Promise<AdminContext | null> => {
  try {
    const user = await getSession()
    if (!user) return null

    if (isFoundingAdminUser(user)) {
      const profile = await getProfileAdminFields(user.id)
      return {
        user,
        isFoundingAdmin: true,
        isAdmin: true,
        role: null,
        permissions: founderPermissions(),
        displayName: profile?.display_name ?? null,
      }
    }

    const profile = await getProfileAdminFields(user.id)
    if (!profile?.is_admin) return null

    const permissions = resolvePermissions(profile.admin_role, profile.admin_permissions)
    return {
      user,
      isFoundingAdmin: false,
      isAdmin: permissions.length > 0,
      role: profile.admin_role,
      permissions,
      displayName: profile.display_name,
    }
  } catch (error) {
    console.error("getAdminContext failed:", error)
    return null
  }
})

export function hasPermission(ctx: AdminContext, permission: AdminPermission): boolean {
  if (ctx.isFoundingAdmin) return true
  return ctx.permissions.includes(permission)
}

export async function getSession() {
  return getServerUser()
}

export async function isUserAdmin(_userId: string, email?: string | null): Promise<boolean> {
  return isFoundingAdminUser({ email })
}

export async function requireAdmin() {
  const ctx = await getAdminContext()
  if (!ctx) {
    const user = await getSession()
    return { user, isAdmin: false as const, context: null }
  }
  return { user: ctx.user, isAdmin: true as const, context: ctx }
}

export async function requirePermission(permission: AdminPermission) {
  const ctx = await getAdminContext()
  if (!ctx) {
    return { ok: false as const, error: "Unauthorized" as const, context: null, user: null }
  }
  if (!hasPermission(ctx, permission)) {
    return { ok: false as const, error: "Forbidden" as const, context: ctx, user: ctx.user }
  }
  return { ok: true as const, context: ctx, user: ctx.user }
}

/** Any admin route access — at least one permission or founding admin */
export async function requireAnyAdminAccess() {
  const ctx = await getAdminContext()
  if (!ctx) {
    return { ok: false as const, error: "Unauthorized" as const, context: null, user: null }
  }
  if (!ctx.isFoundingAdmin && ctx.permissions.length === 0) {
    return { ok: false as const, error: "Forbidden" as const, context: ctx, user: ctx.user }
  }
  return { ok: true as const, context: ctx, user: ctx.user }
}

export async function userHasAdminAccess(user: { id: string; email?: string | null }): Promise<boolean> {
  return isFoundingAdminUser(user)
}

export async function resolveAdminLandingPath(user: { id: string; email?: string | null }): Promise<string> {
  if (isFoundingAdminUser(user)) return "/admin"
  return signInHref({ error: "not_admin" })
}
