"use server"

import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { listAllAuthUsers } from "@/lib/auth-users"
import { getAdminContext, hasPermission, requirePermission } from "@/lib/auth"
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

export type ActiveVolunteerRecord = {
  id: string
  email: string
  displayName: string | null
  accountStatus: AccountStatus
  memberRole: MemberRole
  createdAt: string
  reviewedAt: string | null
}

async function listAuthEmails(): Promise<Map<string, string>> {
  const { users, error } = await listAllAuthUsers()
  if (error) console.error("Error listing auth users for volunteers:", error)
  return new Map(users.filter((user) => user.email).map((user) => [user.id, user.email as string]))
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

    const { error: metadataError } = await admin.auth.admin.updateUserById(input.userId, {
      app_metadata: { account_status: "rejected" },
    })
    if (metadataError) {
      console.error("Failed to sync app_metadata for rejected volunteer:", metadataError)
      return { error: "Profile updated but session metadata sync failed. Retry the decision." }
    }

    revalidatePath("/admin/volunteers")
    revalidatePath("/admin/volunteers/roles")
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

  const { error: metadataError } = await admin.auth.admin.updateUserById(input.userId, {
    app_metadata: {
      account_status: "active",
      member_role: role,
    },
  })
  if (metadataError) {
    console.error("Failed to sync app_metadata for activated volunteer:", metadataError)
    return { error: "Profile updated but session metadata sync failed. Retry the decision." }
  }

  revalidatePath("/admin/volunteers")
  revalidatePath("/admin/volunteers/roles")
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
  revalidatePath("/admin/volunteers/roles")
  revalidatePath("/admin/users")
  return { success: true as const }
}

export async function listActiveVolunteers(): Promise<
  { volunteers: ActiveVolunteerRecord[] } | { error: string }
> {
  const gate = await requirePermission("manage_volunteers")
  if (!gate.ok) {
    return { error: gate.error === "Forbidden" ? "You cannot manage volunteers." : "Unauthorized" }
  }

  const admin = createAdminSupabaseClient()
  const { data, error } = await admin
    .from("profiles")
    .select("id, display_name, account_status, member_role, created_at, reviewed_at")
    .in("account_status", ["active", "suspended"])
    .not("member_role", "is", null)
    .order("reviewed_at", { ascending: false, nullsFirst: false })

  if (error) {
    console.error("Error listing active volunteers:", error)
    return { error: error.message }
  }

  const emails = await listAuthEmails()

  const volunteers: ActiveVolunteerRecord[] = (data ?? [])
    .filter((row) => row.member_role)
    .map((row) => ({
      id: row.id,
      email: emails.get(row.id) ?? "",
      displayName: row.display_name,
      accountStatus: (row.account_status ?? "active") as AccountStatus,
      memberRole: row.member_role as MemberRole,
      createdAt: row.created_at,
      reviewedAt: row.reviewed_at,
    }))

  return { volunteers }
}

export async function updateVolunteerTier(input: { userId: string; tier: MemberRole }) {
  const gate = await requirePermission("manage_volunteers")
  if (!gate.ok) {
    return { error: gate.error === "Forbidden" ? "You cannot manage volunteers." : "Unauthorized" }
  }

  const admin = createAdminSupabaseClient()

  const { data: profile, error: loadError } = await admin
    .from("profiles")
    .select("account_status, member_role")
    .eq("id", input.userId)
    .single()

  if (loadError || !profile) {
    return { error: loadError?.message ?? "Volunteer not found." }
  }

  if (profile.account_status !== "active" || !profile.member_role) {
    return { error: "Only active volunteers can be reassigned to a different tier." }
  }

  const adminFields = memberRoleToAdminFields(input.tier)
  const now = new Date().toISOString()

  const { error } = await admin
    .from("profiles")
    .update({
      member_role: input.tier,
      is_admin: adminFields.is_admin,
      admin_role: adminFields.admin_role,
      admin_permissions: {},
      updated_at: now,
    })
    .eq("id", input.userId)

  if (error) return { error: error.message }

  const { error: metadataError } = await admin.auth.admin.updateUserById(input.userId, {
    app_metadata: { member_role: input.tier },
  })
  if (metadataError) {
    console.error("Failed to sync app_metadata for volunteer tier change:", metadataError)
    return { error: "Profile updated but session metadata sync failed. Retry the change." }
  }

  revalidatePath("/admin/volunteers")
  revalidatePath("/admin/volunteers/roles")
  revalidatePath("/admin/users")
  revalidatePath("/admin")

  return {
    success: true as const,
    tier: MEMBER_ROLE_LABELS[input.tier],
  }
}

export async function suspendVolunteer(input: { userId: string }) {
  const gate = await requirePermission("manage_volunteers")
  if (!gate.ok) {
    return { error: gate.error === "Forbidden" ? "You cannot manage volunteers." : "Unauthorized" }
  }

  const admin = createAdminSupabaseClient()

  const { data: profile, error: loadError } = await admin
    .from("profiles")
    .select("account_status, member_role")
    .eq("id", input.userId)
    .single()

  if (loadError || !profile) {
    return { error: loadError?.message ?? "Volunteer not found." }
  }

  if (profile.account_status !== "active" || !profile.member_role) {
    return { error: "Only active volunteers can be suspended." }
  }

  const now = new Date().toISOString()

  const { error } = await admin
    .from("profiles")
    .update({
      account_status: "suspended",
      is_admin: false,
      admin_role: null,
      admin_permissions: {},
      updated_at: now,
    })
    .eq("id", input.userId)

  if (error) return { error: error.message }

  const { error: metadataError } = await admin.auth.admin.updateUserById(input.userId, {
    app_metadata: { account_status: "suspended" },
  })
  if (metadataError) {
    console.error("Failed to sync app_metadata for suspended volunteer:", metadataError)
    return { error: "Profile updated but session metadata sync failed. Retry the action." }
  }

  revalidatePath("/admin/volunteers")
  revalidatePath("/admin/volunteers/roles")
  revalidatePath("/admin/users")
  return { success: true as const }
}

export async function unsuspendVolunteer(input: { userId: string }) {
  const gate = await requirePermission("manage_volunteers")
  if (!gate.ok) {
    return { error: gate.error === "Forbidden" ? "You cannot manage volunteers." : "Unauthorized" }
  }

  const admin = createAdminSupabaseClient()

  const { data: profile, error: loadError } = await admin
    .from("profiles")
    .select("account_status, member_role")
    .eq("id", input.userId)
    .single()

  if (loadError || !profile) {
    return { error: loadError?.message ?? "Volunteer not found." }
  }

  if (profile.account_status !== "suspended" || !profile.member_role) {
    return { error: "This volunteer is not currently suspended." }
  }

  const role = profile.member_role as MemberRole
  const adminFields = memberRoleToAdminFields(role)
  const now = new Date().toISOString()

  const { error } = await admin
    .from("profiles")
    .update({
      account_status: "active",
      is_admin: adminFields.is_admin,
      admin_role: adminFields.admin_role,
      admin_permissions: {},
      updated_at: now,
    })
    .eq("id", input.userId)

  if (error) return { error: error.message }

  const { error: metadataError } = await admin.auth.admin.updateUserById(input.userId, {
    app_metadata: { account_status: "active", member_role: role },
  })
  if (metadataError) {
    console.error("Failed to sync app_metadata for unsuspended volunteer:", metadataError)
    return { error: "Profile updated but session metadata sync failed. Retry the action." }
  }

  revalidatePath("/admin/volunteers")
  revalidatePath("/admin/volunteers/roles")
  revalidatePath("/admin/users")
  revalidatePath("/admin")
  return { success: true as const }
}

export async function getVolunteerRolesAccess() {
  const ctx = await getAdminContext()
  if (!ctx) {
    return { canManageTiers: false, canViewRoles: false }
  }

  const canManageTiers = ctx.isFoundingAdmin || hasPermission(ctx, "manage_volunteers")
  const canViewRoles =
    canManageTiers ||
    hasPermission(ctx, "view_analytics") ||
    hasPermission(ctx, "manage_duas")

  return { canManageTiers, canViewRoles }
}
