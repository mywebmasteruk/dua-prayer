export const ACCOUNT_STATUSES = ["active", "pending_review", "rejected"] as const
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number]

export const MEMBER_ROLES = ["volunteer", "moderator", "admin"] as const
export type MemberRole = (typeof MEMBER_ROLES)[number]

export type VolunteerApplicationPayload = {
  message?: string | null
  skills?: string | null
  timezone?: string | null
  availability?: string | null
  source?: string | null
  [key: string]: string | null | undefined
}

export type VolunteerRegistrationInput = {
  email: string
  name?: string | null
  application?: VolunteerApplicationPayload
  source?: string | null
}

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  active: "Active",
  pending_review: "Pending review",
  rejected: "Rejected",
}

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  volunteer: "Volunteer",
  moderator: "Moderator",
  admin: "Admin",
}
