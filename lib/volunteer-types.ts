export const ACCOUNT_STATUSES = ["active", "pending_review", "rejected", "suspended"] as const
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number]

export const MEMBER_ROLES = ["volunteer", "moderator", "admin"] as const
export type MemberRole = (typeof MEMBER_ROLES)[number]

import type { FormAnswerValue } from "@/lib/form-fields"

export type VolunteerApplicationPayload = {
  message?: string | null
  skills?: string | null
  timezone?: string | null
  availability?: string | null
  source?: string | null
  /** Registry-driven answers keyed by field id (includes custom + file fields). */
  fields?: Record<string, FormAnswerValue>
  [key: string]: FormAnswerValue | Record<string, FormAnswerValue> | null | undefined
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
  suspended: "Suspended",
}

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  volunteer: "Helper",
  moderator: "Supervisor",
  admin: "Manager",
}
