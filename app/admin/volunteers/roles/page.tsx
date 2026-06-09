import { redirect } from "next/navigation"
import { VolunteerRolesSettings } from "@/components/admin/volunteer-roles-settings"
import {
  getVolunteerRolesAccess,
  listActiveVolunteers,
  type ActiveVolunteerRecord,
} from "@/app/actions/volunteers"
import { getAdminContext } from "@/lib/auth"
import { signInHref } from "@/lib/auth-modal"

export default async function AdminVolunteersRolesPage() {
  const ctx = await getAdminContext()
  if (!ctx) redirect(signInHref({ next: "/admin/volunteers/roles" }))

  const access = await getVolunteerRolesAccess()
  if (!access.canViewRoles) redirect(signInHref({ error: "not_admin" }))

  let roster: ActiveVolunteerRecord[] = []

  if (access.canManageTiers) {
    const result = await listActiveVolunteers()
    if ("volunteers" in result) roster = result.volunteers
  }

  return <VolunteerRolesSettings volunteers={roster} canManageTiers={access.canManageTiers} />
}
