import { Shield } from "lucide-react"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { RolesAccessSettings } from "@/components/admin/roles-access-settings"
import { getCurrentAdminAccess, listAdminUsers } from "@/app/actions/admin-roles"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { signInHref } from "@/lib/auth-modal"
import { redirect } from "next/navigation"

export default async function AdminRolesPage() {
  const ctx = await getAdminContext()
  if (!ctx) redirect(signInHref({ next: "/admin/settings/roles" }))
  if (!ctx.isFoundingAdmin && !hasPermission(ctx, "manage_admins")) {
    redirect("/admin/settings?error=forbidden")
  }

  const access = await getCurrentAdminAccess()
  const adminList = await listAdminUsers()
  const admins = "admins" in adminList ? adminList.admins : []

  return (
    <InnerPageLayout activePath="/admin/settings/roles">
      <AdminPageHeader
        icon={Shield}
        title="Roles & Access"
        backHref="/admin/settings"
        description={
          <>
            Assign roles and permissions to admin team members. The founding admin is controlled by{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">SUPER_ADMIN_EMAIL</code>.
          </>
        }
      />

      <RolesAccessSettings
        currentUser={access.currentUser}
        admins={admins}
        canManageAdmins={access.canManageAdmins}
      />
    </InnerPageLayout>
  )
}
