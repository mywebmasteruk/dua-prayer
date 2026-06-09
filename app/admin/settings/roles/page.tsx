import { Shield } from "lucide-react"
import { InnerPageLayout } from "@/components/inner-page-layout"
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
    <InnerPageLayout activePath="/admin/settings/roles" contentClassName="max-w-[691px]">
      <div className="mb-2 flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" aria-hidden="true" />
        <h1 className="text-2xl font-semibold">Roles &amp; Access</h1>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Assign roles and permissions to admin team members. The founding admin is controlled by{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">SUPER_ADMIN_EMAIL</code>.
      </p>

      <RolesAccessSettings
        currentUser={access.currentUser}
        admins={admins}
        canManageAdmins={access.canManageAdmins}
      />
    </InnerPageLayout>
  )
}
