"use server"

import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { requirePermission } from "@/lib/auth"
import { memberRoleToAdminFields } from "@/lib/volunteers"
import {
  ACCOUNT_STATUS_LABELS,
  MEMBER_ROLE_LABELS,
  type AccountStatus,
  type MemberRole,
  type VolunteerApplicationPayload,
} from "@/lib/volunteer-types"

export type VolunteerApplicantRecord = {
  id: string
  email: string
  displayName: string | null
  accountStatus: AccountStatus
  memberRole: MemberRole | null
  application: VolunteerApplicationPayload | null
  createdAt: string
  reviewedAt: string | null
}

async function listAuthEmails(): Promise<Map<string, string>> {
  const admin = createAdminSupabaseClient()
  const map = new Map<string, string>()

  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) {
      console.error("Error listing auth users for volunteers:", error)
      break
    }

    for (const user of data.users) {
      if (user.email) map.set(user.id, user.email)
    }

    if (data.users.length < perPage) break
    page += 1
  }

  return map
}

function parseApplication(value: unknown): VolunteerApplicationPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as VolunteerApplicationPayload
}

export async function listVolunteerApplicants(input?: {
  status?: AccountStatus
}): Promise<{ applicants: VolunteerApplicantRecord[] } | { error: string }> {
  const gate = await requirePermission("manage_volunteers")
  if (!gate.ok) {
    return { error: gate.error === "Forbidden" ? "You cannot manage volunteers." : "Unauthorized" }
  }

  const admin = createAdminSupabaseClient()
  let query = admin
    .from("profiles")
    .select(
      "id, display_name, account_status, member_role, volunteer_application, created_at, reviewed_at",
    )
    .not("volunteer_application", "is", null)
    .order("created_at", { ascending: false })

  if (input?.status) {
    query = query.eq("account_status", input.status)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error listing volunteer applicants:", error)
    return { error: error.message }
  }

  const emails = await listAuthEmails()

  const applicants: VolunteerApplicantRecord[] = (data ?? []).map((row) => ({
    id: row.id,
    email: emails.get(row.id) ?? "",
    displayName: row.display_name,
    accountStatus: (row.account_status ?? "pending_review") as AccountStatus,
    memberRole: row.member_role as MemberRole | null,
    application: parseApplication(row.volunteer_application),
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  }))

  return { applicants }
}

export async function reviewVolunteerApplicant(input: {
  userId: string
  decision: "activate" | "reject"
  role?: MemberRole
}) {
  const gate = await requirePermission("manage_volunteers")
  if (!gate.ok) {
    return { error: gate.error === "Forbidden" ? "You cannot manage volunteers." : "Unauthorized" }
  }

  if (input.decision === "activate" && !input.role) {
    return { error: "Choose a role before activating." }
  }

  const admin = createAdminSupabaseClient()

  const { data: profile, error: loadError } = await admin
    .from("profiles")
    .select("account_status, volunteer_application")
    .eq("id", input.userId)
    .single()

  if (loadError || !profile) {
    return { error: loadError?.message ?? "Applicant not found." }
  }

  if (!profile.volunteer_application) {
    return { error: "This user is not a volunteer applicant." }
  }

  const now = new Date().toISOString()
  const reviewerId = gate.user.id

  if (input.decision === "reject") {
    const { error } = await admin
      .from("profiles")
      .update({
        account_status: "rejected",
        member_role: null,
        is_admin: false,
        admin_role: null,
        admin_permissions: {},
        reviewed_at: now,
        reviewed_by: reviewerId,
        updated_at: now,
      })
      .eq("id", input.userId)

    if (error) return { error: error.message }

    await admin.auth.admin.updateUserById(input.userId, {
      app_metadata: { account_status: "rejected" },
    })

    revalidatePath("/admin/volunteers")
    revalidatePath("/admin/users")
    return { success: true as const, status: ACCOUNT_STATUS_LABELS.rejected }
  }

  const role = input.role!
  const adminFields = memberRoleToAdminFields(role)

  const { error } = await admin
    .from("profiles")
    .update({
      account_status: "active",
      member_role: role,
      is_admin: adminFields.is_admin,
      admin_role: adminFields.admin_role,
      admin_permissions: {},
      reviewed_at: now,
      reviewed_by: reviewerId,
      updated_at: now,
    })
    .eq("id", input.userId)

  if (error) return { error: error.message }

  await admin.auth.admin.updateUserById(input.userId, {
    app_metadata: {
      account_status: "active",
      member_role: role,
    },
  })

  revalidatePath("/admin/volunteers")
  revalidatePath("/admin/users")
  revalidatePath("/admin")

  return {
    success: true as const,
    status: ACCOUNT_STATUS_LABELS.active,
    role: MEMBER_ROLE_LABELS[role],
  }
}

export async function deleteVolunteerApplicant(input: { userId: string }) {
  const gate = await requirePermission("manage_volunteers")
  if (!gate.ok) {
    return { error: gate.error === "Forbidden" ? "You cannot manage volunteers." : "Unauthorized" }
  }

  const admin = createAdminSupabaseClient()

  const { data: profile, error: loadError } = await admin
    .from("profiles")
    .select("account_status, volunteer_application")
    .eq("id", input.userId)
    .single()

  if (loadError || !profile) {
    return { error: loadError?.message ?? "Applicant not found." }
  }

  if (!profile.volunteer_application) {
    return { error: "This user is not a volunteer applicant." }
  }

  if (profile.account_status === "active") {
    return {
      error: "Cannot delete an activated volunteer. Manage their account from Users instead.",
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(input.userId)
  if (deleteError) return { error: deleteError.message }

  revalidatePath("/admin/volunteers")
  revalidatePath("/admin/users")
  return { success: true as const }
}
