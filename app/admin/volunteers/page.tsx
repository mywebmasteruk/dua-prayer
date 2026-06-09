import { HandHeart } from "lucide-react"
import { redirect } from "next/navigation"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminVolunteersList } from "@/components/admin/admin-volunteers-list"
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
    <InnerPageLayout activePath="/admin/volunteers" contentClassName="max-w-[900px]">
      <div className="mb-2 flex items-center gap-2">
        <HandHeart className="h-6 w-6 text-primary" aria-hidden="true" />
        <h1 className="text-2xl font-semibold">Volunteer applications</h1>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Review new volunteer sign-ups, assign a role, and activate accounts. Pending applicants cannot sign in
        until approved.
      </p>

      <AdminVolunteersList initialApplicants={applicants} initialFilter="pending_review" />
    </InnerPageLayout>
  )
}
