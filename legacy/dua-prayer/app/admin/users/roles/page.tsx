import { redirect } from "next/navigation"
import { RolesAccessSettings } from "@/components/admin/roles-access-settings"
import { getCurrentAdminAccess } from "@/app/actions/admin-roles"
import { getRolePermissionsForAdmin } from "@/lib/role-permissions-server"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { signInHref } from "@/lib/auth-modal"

export default async function AdminUsersRolesPage() {
  const ctx = await getAdminContext()
  if (!ctx) redirect(signInHref({ next: "/admin/users/roles" }))

  const canViewRoles =
    ctx.isFoundingAdmin || hasPermission(ctx, "manage_admins") || hasPermission(ctx, "manage_users")
  if (!canViewRoles) redirect(signInHref({ error: "not_admin" }))

  const [access, rolePermissions] = await Promise.all([
    getCurrentAdminAccess(),
    getRolePermissionsForAdmin(),
  ])

  return (
    <RolesAccessSettings
      currentUser={access.currentUser}
      rolePermissions={rolePermissions}
      canManageAdmins={access.canManageAdmins}
    />
  )
}
