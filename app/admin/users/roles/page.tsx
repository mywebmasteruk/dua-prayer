import { redirect } from "next/navigation"
import { RolesAccessSettings } from "@/components/admin/roles-access-settings"
import { getCurrentAdminAccess, listAdminUsers } from "@/app/actions/admin-roles"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { signInHref } from "@/lib/auth-modal"

export default async function AdminUsersRolesPage() {
  const ctx = await getAdminContext()
  if (!ctx) redirect(signInHref({ next: "/admin/users/roles" }))

  const canViewRoles =
    ctx.isFoundingAdmin || hasPermission(ctx, "manage_admins") || hasPermission(ctx, "manage_users")
  if (!canViewRoles) redirect(signInHref({ error: "not_admin" }))

  const access = await getCurrentAdminAccess()
  const adminList = await listAdminUsers()
  const admins = "admins" in adminList ? adminList.admins : []

  return (
    <RolesAccessSettings
      currentUser={access.currentUser}
      admins={admins}
      canManageAdmins={access.canManageAdmins}
    />
  )
}
