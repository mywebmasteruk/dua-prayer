import type { AdminPermission } from "@/lib/admin-permissions"
import { ROLE_PERMISSIONS } from "@/lib/admin-permissions"
import type { MemberRole } from "@/lib/volunteer-types"

/** Volunteer program tiers — stored on `profiles.member_role`. */
export const VOLUNTEER_TIER_ORDER: MemberRole[] = ["admin", "moderator", "volunteer"]

export const VOLUNTEER_TIER_LABELS: Record<MemberRole, string> = {
  admin: "Manager",
  moderator: "Supervisor",
  volunteer: "Helper",
}

export const VOLUNTEER_TIER_SUMMARY: Record<MemberRole, string> = {
  admin: "Leads the volunteer team with the broadest admin access below super admin.",
  moderator: "Reviews community content and supports volunteers day to day.",
  volunteer: "Entry tier for approved volunteers — analytics and guidance, no moderation tools.",
}

export type VolunteerCapabilityArea = "content" | "support" | "platform"

export type VolunteerCapabilityRow = {
  area: VolunteerCapabilityArea
  label: string
  helper: string
  supervisor: string
  manager: string
}

export const VOLUNTEER_CAPABILITY_MATRIX: VolunteerCapabilityRow[] = [
  {
    area: "content",
    label: "Content moderation",
    helper: "No admin moderation tools (escalate flagged duas to a supervisor).",
    supervisor: "Review, edit, and publish duas; manage channels.",
    manager: "Full dua and channel moderation, including removal when needed.",
  },
  {
    area: "support",
    label: "Customer & volunteer support",
    helper: "Support community members outside the admin panel; escalate issues.",
    supervisor: "Respond to volunteer questions and help with applicant follow-up.",
    manager: "Manage the volunteer application queue and active volunteer roster.",
  },
  {
    area: "platform",
    label: "Platform administration",
    helper: "View platform analytics only.",
    supervisor: "No site settings access.",
    manager: "Site copy, integrations, and most admin settings (not super admin roles).",
  },
]

export const VOLUNTEER_TIER_RESPONSIBILITIES: Record<MemberRole, string[]> = {
  volunteer: [
    "Welcome new community members and answer basic questions.",
    "Escalate flagged or sensitive duas to a supervisor.",
    "View high-level platform analytics in the admin area.",
  ],
  moderator: [
    "Review pending duas and publish or return them for edits.",
    "Maintain channel listings and community categories.",
    "Coach helpers and respond to volunteer coordination threads.",
  ],
  admin: [
    "Approve or reject volunteer applications and assign tiers.",
    "Manage users, site copy, integrations, and volunteer workflows.",
    "Handle escalated moderation decisions and platform policy issues.",
  ],
}

/** Maps volunteer tier to effective admin permissions (founding admin unchanged). */
export function permissionsForVolunteerTier(tier: MemberRole): AdminPermission[] {
  switch (tier) {
    case "volunteer":
      return [...ROLE_PERMISSIONS.volunteer]
    case "moderator":
      return [...ROLE_PERMISSIONS.moderator]
    case "admin":
      return [...ROLE_PERMISSIONS.admin]
    default:
      return []
  }
}

export const DEFAULT_VOLUNTEER_TIER: MemberRole = "volunteer"
