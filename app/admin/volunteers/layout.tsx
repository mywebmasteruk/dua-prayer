import Link from "next/link"
import { HandHeart } from "lucide-react"
import { redirect } from "next/navigation"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminVolunteersTabBar } from "@/components/admin/admin-volunteers-tab-bar"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { signInHref } from "@/lib/auth-modal"

export default async function AdminVolunteersLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAdminContext()
  if (!ctx) redirect(signInHref({ next: "/admin/volunteers" }))

  const canManageApplicants = ctx.isFoundingAdmin || hasPermission(ctx, "manage_volunteers")
  const canViewRoles =
    canManageApplicants ||
    hasPermission(ctx, "view_analytics") ||
    hasPermission(ctx, "manage_duas")

  if (!canManageApplicants && !canViewRoles) redirect(signInHref({ error: "not_admin" }))

  return (
    <InnerPageLayout activePath="/admin/volunteers">
      <AdminPageHeader
        icon={HandHeart}
        title="Volunteers"
        description={
          <>
            Review applications, define volunteer tiers, and assign capabilities. Configure Fillout webhooks in{" "}
            <Link href="/admin/integration?tab=webhooks" className="text-primary underline-offset-2 hover:underline">
              Integration → Webhooks
            </Link>
            .
          </>
        }
      />

      <AdminVolunteersTabBar showApplicantsTab={canManageApplicants} showRolesTab={canViewRoles} />

      <div className="mt-6">{children}</div>
    </InnerPageLayout>
  )
}
