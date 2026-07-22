import type { AppUserRecord } from "@/app/actions/admin-users"
import { MEMBER_ROLE_LABELS } from "@/lib/volunteer-types"

export const USER_TYPE_FILTERS = ["all", "admin", "volunteer", "user", "channel_admin"] as const
export type UserTypeFilter = (typeof USER_TYPE_FILTERS)[number]

export const USER_TYPE_FILTER_LABELS: Record<Exclude<UserTypeFilter, "all">, string> = {
  admin: "Admins",
  volunteer: "Volunteers",
  user: "Users",
  channel_admin: "Channel Admins",
}

export function parseUserTypeFilter(value: string | undefined | null): UserTypeFilter {
  if (value && (USER_TYPE_FILTERS as readonly string[]).includes(value)) {
    return value as UserTypeFilter
  }
  return "all"
}

export function isAdminUser(user: Pick<AppUserRecord, "isAdmin" | "isFoundingAdmin">): boolean {
  return user.isAdmin || user.isFoundingAdmin
}

/** Active users who applied as volunteers and were approved (member_role) or retain application data. */
export function isVolunteerUser(
  user: Pick<AppUserRecord, "memberRole" | "hasVolunteerApplication">,
): boolean {
  return user.memberRole === "volunteer" || user.hasVolunteerApplication
}

/**
 * Channel/category owners — users with an approved community channel (`categories.owner_id`).
 */
export function isChannelAdminUser(user: Pick<AppUserRecord, "isChannelAdmin">): boolean {
  return user.isChannelAdmin
}

export function isRegularUser(user: AppUserRecord): boolean {
  return !isAdminUser(user) && !isVolunteerUser(user) && !isChannelAdminUser(user)
}

export function matchesUserTypeFilter(user: AppUserRecord, filter: UserTypeFilter): boolean {
  switch (filter) {
    case "all":
      return true
    case "admin":
      return isAdminUser(user)
    case "volunteer":
      return isVolunteerUser(user)
    case "user":
      return isRegularUser(user)
    case "channel_admin":
      return isChannelAdminUser(user)
    default:
      return true
  }
}

export type UserTypeBadge = {
  label: string
  tone: "success" | "warning" | "neutral"
}

export function userTypeBadges(user: AppUserRecord): UserTypeBadge[] {
  const badges: UserTypeBadge[] = []

  if (isAdminUser(user)) {
    badges.push({
      label: user.roleLabel,
      tone: user.isFoundingAdmin ? "success" : "warning",
    })
  }

  if (isVolunteerUser(user)) {
    badges.push({
      label: user.memberRole ? MEMBER_ROLE_LABELS[user.memberRole] : "Volunteer",
      tone: "neutral",
    })
  }

  if (isChannelAdminUser(user)) {
    badges.push({ label: "Channel Admin", tone: "success" })
  }

  if (badges.length === 0) {
    badges.push({ label: "User", tone: "neutral" })
  }

  return badges
}
