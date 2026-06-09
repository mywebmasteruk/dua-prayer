import { Users } from "lucide-react"
import { redirect } from "next/navigation"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminUsersList } from "@/components/admin/admin-users-list"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { listAppUsers } from "@/app/actions/admin-users"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { signInHref } from "@/lib/auth-modal"

export default async function AdminUsersPage() {
  const ctx = await getAdminContext()
  if (!ctx) redirect(signInHref({ next: "/admin/users" }))
  if (!hasPermission(ctx, "manage_users")) redirect(signInHref({ error: "not_admin" }))

  const result = await listAppUsers()
  const users = "users" in result ? result.users : []

  return (
    <InnerPageLayout activePath="/admin/users">
      <AdminPageHeader
        icon={Users}
        title="Users"
        description="View community accounts, update display names, and assign User, Moderator, or Admin roles."
      />

      <AdminUsersList users={users} currentUserId={ctx.user.id} />
    </InnerPageLayout>
  )
}
