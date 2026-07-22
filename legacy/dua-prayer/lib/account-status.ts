import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import type { AccountStatus } from "@/lib/volunteer-types"

export type ProfileAccessState = {
  accountStatus: AccountStatus
  displayName: string | null
}

export async function getProfileAccessState(userId: string): Promise<ProfileAccessState | null> {
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin
    .from("profiles")
    .select("account_status, display_name")
    .eq("id", userId)
    .single()

  if (error || !data) return null

  return {
    accountStatus: (data.account_status ?? "active") as AccountStatus,
    displayName: data.display_name,
  }
}

export function shouldLimitInactiveAccount(status: AccountStatus): boolean {
  return status !== "active"
}

export function accountStatusPostAuthRedirect(status: AccountStatus): string | null {
  if (!shouldLimitInactiveAccount(status)) return null
  return "/account"
}

export function accountStatusSignInMessage(status: AccountStatus): string {
  if (status === "pending_review") {
    return "Your volunteer application is under review. We will email you when your account is activated."
  }
  if (status === "rejected") {
    return "Your volunteer application was not approved. Contact volunteers@duaprayer.app if you have questions."
  }
  if (status === "suspended") {
    return "Your volunteer account has been suspended. Contact volunteers@duaprayer.app if you have questions."
  }
  return "Your account cannot sign in right now."
}
