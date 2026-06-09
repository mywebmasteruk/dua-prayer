import { HandHeart } from "lucide-react"
import { redirect } from "next/navigation"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminVolunteersList } from "@/components/admin/admin-volunteers-list"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { listVolunteerApplicants } from "@/app/actions/volunteers"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { signInHref } from "@/lib/auth-modal"

export default async function AdminVolunteersPage() {
  const ctx = await getAdminContext()
  if (!ctx) redirect(signInHref({ next: "/admin/volunteers" }))
  if (!hasPermission(ctx, "manage_volunteers")) redirect(signInHref({ error: "not_admin" }))

  const result = await listVolunteerApplicants({ status: "pending_review" })
  const applicants = "applicants" in result ? result.applicants : []

  return (
    <InnerPageLayout activePath="/admin/volunteers">
      <AdminPageHeader
        icon={HandHeart}
        title="Volunteer applications"
        description="Review new volunteer sign-ups, assign a role, and activate accounts. Pending applicants cannot sign in until approved."
      />

      <AdminVolunteersList initialApplicants={applicants} initialFilter="pending_review" />
    </InnerPageLayout>
  )
}
