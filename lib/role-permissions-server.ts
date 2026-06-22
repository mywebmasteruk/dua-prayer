import { unstable_cache } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { isMissingTableError } from "@/lib/db-errors"
import { SITE_SETTING_KEYS } from "@/lib/settings-keys"
import {
  ADMIN_PERMISSIONS,
  ASSIGNABLE_ADMIN_ROLES,
  ROLE_PERMISSIONS,
  isAdminPermission,
  type AdminPermission,
  type AdminRoleType,
} from "@/lib/admin-permissions"

export type RolePermissionMap = Record<AdminRoleType, AdminPermission[]>

const EDITABLE_ROLES: readonly AdminRoleType[] = [...ASSIGNABLE_ADMIN_ROLES, "volunteer"]

// Strip manage_admins from any preset — it stays founder-only — and keep only
// valid permission keys in canonical order.
function sanitize(perms: unknown): AdminPermission[] {
  if (!Array.isArray(perms)) return []
  const set = new Set<AdminPermission>()
  for (const p of perms) {
    if (typeof p === "string" && isAdminPermission(p) && p !== "manage_admins") set.add(p)
  }
  return ADMIN_PERMISSIONS.filter((p) => set.has(p))
}

function defaults(): RolePermissionMap {
  return {
    admin: sanitize(ROLE_PERMISSIONS.admin),
    moderator: sanitize(ROLE_PERMISSIONS.moderator),
    volunteer: sanitize(ROLE_PERMISSIONS.volunteer),
  }
}

async function fetchRolePermissions(): Promise<RolePermissionMap> {
  const result = defaults()

  let supabase
  try {
    supabase = createAdminSupabaseClient()
  } catch {
    return result
  }

  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", SITE_SETTING_KEYS.adminRolePermissions)
    .maybeSingle()

  if (error) {
    if (!isMissingTableError(error)) console.error("Error fetching role permissions:", error)
    return result
  }
  if (!data?.value) return result

  try {
    const parsed = JSON.parse(data.value as string) as Record<string, unknown>
    for (const role of EDITABLE_ROLES) {
      if (Array.isArray(parsed[role])) result[role] = sanitize(parsed[role])
    }
  } catch {
    // keep defaults on malformed JSON
  }
  return result
}

const getRolePermissionsCached = unstable_cache(fetchRolePermissions, ["admin-role-permissions"], {
  revalidate: 300,
  tags: ["admin-role-permissions"],
})

/** Effective role → permissions map (stored overrides merged over defaults). */
export async function getRolePermissions(): Promise<RolePermissionMap> {
  return getRolePermissionsCached()
}

/** Uncached read for the admin matrix — caller must enforce RBAC. */
export async function getRolePermissionsForAdmin(): Promise<RolePermissionMap> {
  return fetchRolePermissions()
}
