import { redirect } from "next/navigation"
import { AdminVolunteersList } from "@/components/admin/admin-volunteers-list"
import { listVolunteerApplicants } from "@/app/actions/volunteers"
import { getVolunteerFormRegistry } from "@/lib/site-settings-server"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { signInHref } from "@/lib/auth-modal"

export default async function AdminVolunteersApplicantsPage() {
  const ctx = await getAdminContext()
  if (!ctx) redirect(signInHref({ next: "/admin/volunteers" }))
  if (!ctx.isFoundingAdmin && !hasPermission(ctx, "manage_volunteers")) {
    redirect("/admin/volunteers/roles")
  }

  const [result, registry] = await Promise.all([
    listVolunteerApplicants({ status: "pending_review" }),
    getVolunteerFormRegistry(),
  ])
  const applicants = "applicants" in result ? result.applicants : []

  return (
    <AdminVolunteersList initialApplicants={applicants} initialFilter="pending_review" registry={registry} />
  )
}
