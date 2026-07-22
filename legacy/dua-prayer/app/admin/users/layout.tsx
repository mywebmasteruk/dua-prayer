import { Users } from "lucide-react"
import { redirect } from "next/navigation"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminUsersTabBar } from "@/components/admin/admin-users-tab-bar"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { signInHref } from "@/lib/auth-modal"

export default async function AdminUsersLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAdminContext()
  if (!ctx) redirect(signInHref({ next: "/admin/users" }))

  const canManageUsers = ctx.isFoundingAdmin || hasPermission(ctx, "manage_users")
  const canViewRoles =
    ctx.isFoundingAdmin || hasPermission(ctx, "manage_admins") || hasPermission(ctx, "manage_users")

  if (!canManageUsers && !canViewRoles) redirect(signInHref({ error: "not_admin" }))

  return (
    <InnerPageLayout activePath="/admin/users">
      <AdminPageHeader
        icon={Users}
        title="Users"
        description="Community accounts, admin roles, and permissions."
      />

      <AdminUsersTabBar showUsersTab={canManageUsers} showRolesTab={canViewRoles} />

      <div className="mt-6">{children}</div>
    </InnerPageLayout>
  )
}
