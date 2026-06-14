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
    channelType?: string | null
    socialMediaLink?: string | null
    location?: string | null
    languages?: string | null
    registrationNumber?: string | null
    role?: string | null
    agreedToTerms?: boolean | null
    fields?: Record<string, import("@/lib/form-fields").FormAnswerValue>
  }
  source?: string
}

export type { ChannelApplicationPayload }
