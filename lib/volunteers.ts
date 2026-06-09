import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import type { AdminRoleType } from "@/lib/admin-permissions"
import {
  type AccountStatus,
  type MemberRole,
  type VolunteerApplicationPayload,
  type VolunteerRegistrationInput,
} from "@/lib/volunteer-types"

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function memberRoleToAdminFields(role: MemberRole): {
  is_admin: boolean
  admin_role: AdminRoleType | null
} {
  if (role === "volunteer") return { is_admin: false, admin_role: null }
  return { is_admin: true, admin_role: role }
}

export async function notifyVolunteerWebhook(payload: Record<string, unknown>) {
  const url = process.env.VOLUNTEER_NOTIFY_WEBHOOK_URL?.trim()
  if (!url) return

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "volunteer.application.created",
        timestamp: new Date().toISOString(),
        ...payload,
      }),
    })
  } catch (error) {
    console.error("Volunteer notify webhook failed:", error)
  }
}

export type VolunteerRegistrationResult =
  | { ok: true; userId: string; created: boolean; status: AccountStatus }
  | { ok: false; error: string; status?: number }

export async function registerVolunteerApplicant(
  input: VolunteerRegistrationInput,
): Promise<VolunteerRegistrationResult> {
  const email = normalizeEmail(input.email)
  if (!isValidEmail(email)) {
    return { ok: false, error: "A valid email is required.", status: 400 }
  }

  const displayName = input.name?.trim() || email.split("@")[0]
  const application: VolunteerApplicationPayload = {
    ...(input.application ?? {}),
    source: input.source ?? input.application?.source ?? "webhook",
  }

  const admin = createAdminSupabaseClient()

  let existingUserId: string | null = null
  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) break
    const match = data.users.find((u) => u.email?.toLowerCase() === email)
    if (match) {
      existingUserId = match.id
      break
    }
    if (data.users.length < perPage) break
    page += 1
  }

  if (existingUserId) {
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("account_status")
      .eq("id", existingUserId)
      .single()

    if (profileError) {
      console.error("Error loading existing volunteer profile:", profileError)
      return { ok: false, error: "Could not update application.", status: 500 }
    }

    const status = (profile?.account_status ?? "active") as AccountStatus

    if (status === "active") {
      return {
        ok: false,
        error: "An active account already exists for this email.",
        status: 409,
      }
    }

    const { error: updateError } = await admin
      .from("profiles")
      .update({
        display_name: displayName,
        account_status: "pending_review",
        member_role: null,
        volunteer_application: application,
        reviewed_at: null,
        reviewed_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingUserId)

    if (updateError) {
      console.error("Error updating volunteer profile:", updateError)
      return { ok: false, error: updateError.message, status: 500 }
    }

    await admin.auth.admin.updateUserById(existingUserId, {
      app_metadata: {
        account_status: "pending_review",
        volunteer_application: application,
      },
      user_metadata: { display_name: displayName },
    })

    return { ok: true, userId: existingUserId, created: false, status: "pending_review" }
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { display_name: displayName },
    app_metadata: {
      account_status: "pending_review",
      display_name: displayName,
      volunteer_application: application,
    },
  })

  if (createError || !created.user) {
    console.error("Error creating volunteer auth user:", createError)
    return { ok: false, error: createError?.message ?? "Could not create account.", status: 500 }
  }

  const { error: profileUpsertError } = await admin.from("profiles").upsert(
    {
      id: created.user.id,
      display_name: displayName,
      account_status: "pending_review",
      member_role: null,
      volunteer_application: application,
      is_admin: false,
      admin_role: null,
      admin_permissions: {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  )

  if (profileUpsertError) {
    console.error("Error upserting volunteer profile:", profileUpsertError)
    return { ok: false, error: profileUpsertError.message, status: 500 }
  }

  return { ok: true, userId: created.user.id, created: true, status: "pending_review" }
}
