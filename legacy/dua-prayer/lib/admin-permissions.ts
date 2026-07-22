export const ADMIN_PERMISSIONS = [
  "manage_duas",
  "manage_channels",
  "manage_users",
  "manage_settings",
  "manage_admins",
  "manage_volunteers",
  "view_analytics",
] as const

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number]

export type AdminRoleType = "admin" | "moderator" | "volunteer"

export const ADMIN_ROLE_LABELS: Record<AdminRoleType, string> = {
  admin: "Admin",
  moderator: "Moderator",
  volunteer: "Volunteer helper",
}

/** Admin roles assignable from Users → Roles (volunteer helper tier is set via Volunteers). */
export const ASSIGNABLE_ADMIN_ROLES = ["admin", "moderator"] as const satisfies readonly AdminRoleType[]

export const USER_ROLE_LABEL = "User"
export const SUPER_ADMIN_ROLE_LABEL = "Super Admin"

export const PERMISSION_LABELS: Record<AdminPermission, string> = {
  manage_duas: "Manage duas",
  manage_channels: "Manage channels",
  manage_users: "Manage users",
  manage_settings: "Site settings",
  manage_admins: "Manage admins & roles",
  manage_volunteers: "Volunteer applications",
  view_analytics: "View analytics",
}

/** Role presets — `manage_admins` is founder-only and never included here. */
export const ROLE_PERMISSIONS: Record<AdminRoleType, readonly AdminPermission[]> = {
  volunteer: ["view_analytics"],
  moderator: ["manage_duas", "manage_channels", "view_analytics"],
  admin: [
    "manage_duas",
    "manage_channels",
    "manage_users",
    "manage_settings",
    "manage_volunteers",
    "view_analytics",
  ],
}

export function isAdminPermission(value: string): value is AdminPermission {
  return (ADMIN_PERMISSIONS as readonly string[]).includes(value)
}

/**
 * Permissions that can be toggled per-role in the admin matrix. `manage_admins`
 * is intentionally excluded — it stays founder-only so a role preset can never
 * grant the ability to manage other admins (privilege-escalation guard).
 */
export const EDITABLE_ROLE_PERMISSIONS: readonly AdminPermission[] = ADMIN_PERMISSIONS.filter(
  (p) => p !== "manage_admins",
)

/** Resolve effective permissions from an explicit base list + per-user overrides. */
export function resolvePermissionsFrom(
  base: readonly AdminPermission[],
  overrides: AdminPermissionOverrides = {},
): AdminPermission[] {
  const set = new Set<AdminPermission>(base)
  for (const [key, enabled] of Object.entries(overrides)) {
    if (!isAdminPermission(key)) continue
    if (enabled) set.add(key)
    else set.delete(key)
  }
  return ADMIN_PERMISSIONS.filter((p) => set.has(p))
}

export type AdminPermissionOverrides = Partial<Record<AdminPermission, boolean>>

export function resolvePermissions(
  role: AdminRoleType | null,
  overrides: AdminPermissionOverrides = {},
): AdminPermission[] {
  const base = role ? [...ROLE_PERMISSIONS[role]] : []
  const set = new Set<AdminPermission>(base)

  for (const [key, enabled] of Object.entries(overrides)) {
    if (!isAdminPermission(key)) continue
    if (enabled) set.add(key)
    else set.delete(key)
  }

  return ADMIN_PERMISSIONS.filter((p) => set.has(p))
}

export function allPermissions(): AdminPermission[] {
  return [...ADMIN_PERMISSIONS]
}

export function founderPermissions(): AdminPermission[] {
  return allPermissions()
}
