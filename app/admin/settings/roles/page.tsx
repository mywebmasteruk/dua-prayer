import Link from "next/link"
import { ArrowLeft, Shield } from "lucide-react"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminNav } from "@/components/admin/admin-nav"
import { RolesAccessSettings } from "@/components/admin/roles-access-settings"
import { getCurrentAdminAccess, listAdminUsers } from "@/app/actions/admin-roles"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminRolesPage() {
  const ctx = await getAdminContext()
  if (!ctx) redirect("/auth?next=/admin/settings/roles")
  if (!ctx.isFoundingAdmin && !hasPermission(ctx, "manage_admins")) {
    redirect("/admin/settings?error=forbidden")
  }

  const access = await getCurrentAdminAccess()
  const adminList = await listAdminUsers()
  const admins = "admins" in adminList ? adminList.admins : []

  return (
    <InnerPageLayout activePath="/admin" contentClassName="max-w-[691px]">
      <Link
        href="/admin/settings"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to settings
      </Link>
      <div className="mb-2 flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" aria-hidden="true" />
        <h1 className="text-2xl font-semibold">Roles &amp; Access</h1>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Assign roles and permissions to admin team members. The founding admin is controlled by{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">SUPER_ADMIN_EMAIL</code>.
      </p>

      <AdminNav permissions={ctx.permissions} isFoundingAdmin={ctx.isFoundingAdmin} active="roles" />

      <RolesAccessSettings
        currentUser={access.currentUser}
        admins={admins}
        canManageAdmins={access.canManageAdmins}
      />
    </InnerPageLayout>
  )
}
