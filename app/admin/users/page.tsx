import Link from "next/link"
import { ArrowLeft, Users } from "lucide-react"
import { redirect } from "next/navigation"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminNav } from "@/components/admin/admin-nav"
import { AdminUsersList } from "@/components/admin/admin-users-list"
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
    <InnerPageLayout activePath="/admin" contentClassName="max-w-[691px]">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to dashboard
      </Link>
      <div className="mb-2 flex items-center gap-2">
        <Users className="h-6 w-6 text-primary" aria-hidden="true" />
        <h1 className="text-2xl font-semibold">Users</h1>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        View community accounts, update display names, and assign User, Moderator, or Admin roles.
      </p>

      <AdminNav permissions={ctx.permissions} isFoundingAdmin={ctx.isFoundingAdmin} active="users" />

      <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
        <AdminUsersList users={users} />
      </section>
    </InnerPageLayout>
  )
}
