import type { ChannelApplicationPayload } from "@/lib/channel-types"

export type ChannelApplicationInput = {
  channelName: string
  description: string
  applicantEmail: string
  applicantName?: string | null
  handle?: string | null
  filloutSubmissionId?: string | null
  applicantUserId?: string | null
  payload?: {
    message?: string | null
    organization?: string | null
    website?: string | null
    source?: string | null
  }
  source?: string
}

export type { ChannelApplicationPayload }
