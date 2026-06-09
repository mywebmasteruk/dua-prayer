export const CHANNEL_TYPES = ["category", "user"] as const
export type ChannelType = (typeof CHANNEL_TYPES)[number]

export const CHANNEL_STATUSES = ["approved", "pending_review", "rejected"] as const
export type ChannelStatus = (typeof CHANNEL_STATUSES)[number]

export const CHANNEL_TYPE_LABELS: Record<ChannelType, string> = {
  category: "Category",
  user: "Community",
}

export const CHANNEL_STATUS_LABELS: Record<ChannelStatus, string> = {
  approved: "Approved",
  pending_review: "Pending review",
  rejected: "Rejected",
}

export type ChannelApplicationPayload = {
  name: string
  description: string
  handle?: string
  message?: string
  applicantEmail?: string
  applicantName?: string
  filloutSubmissionId?: string
  organization?: string
  website?: string
  source?: string
}

export type ChannelTypeFilter = "all" | ChannelType

export const CHANNEL_TYPE_FILTER_OPTIONS: Array<{ id: ChannelTypeFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "category", label: "Categories" },
  { id: "user", label: "Community" },
]

export function normalizeChannelHandle(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 32)
}

export function channelHandleFromName(name: string): string {
  return normalizeChannelHandle(name.replace(/\s+/g, ""))
}
