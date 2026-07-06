import { redirect } from "next/navigation"
import { AdminUsersList } from "@/components/admin/admin-users-list"
import { listAppUsers } from "@/app/actions/admin-users"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { signInHref } from "@/lib/auth-modal"
import { parseUserTypeFilter } from "@/lib/user-types"

type PageProps = {
  searchParams: Promise<{ type?: string }>
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const ctx = await getAdminContext()
  if (!ctx) redirect(signInHref({ next: "/admin/users" }))

  const canManageUsers = ctx.isFoundingAdmin || hasPermission(ctx, "manage_users")
  if (!canManageUsers) redirect("/admin/users/roles")

  // Changing admin roles is founder-only (manage_admins); a plain manage_users
  // admin can edit/delete users but not grant or revoke admin roles.
  const canManageRoles = ctx.isFoundingAdmin || hasPermission(ctx, "manage_admins")

  const params = await searchParams
  const initialTypeFilter = parseUserTypeFilter(params.type)

  const result = await listAppUsers()
  const users = "users" in result ? result.users : []

  return (
    <AdminUsersList
      users={users}
      currentUserId={ctx.user.id}
      initialTypeFilter={initialTypeFilter}
      canManageRoles={canManageRoles}
    />
  )
}
