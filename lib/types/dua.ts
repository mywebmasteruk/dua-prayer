import type { ChannelStatus, ChannelType } from "@/lib/channel-types"

export interface Dua {
  id: number
  text: string
  user_id: string | null
  /** Topic category (channel_type='category'), e.g. Health, Family. */
  category_id: number | null
  /** Optional community channel (channel_type='user') the dua was posted into. */
  channel_id: number | null
  likes: number
  created_at: string
  category_name?: string
  category_channel_type?: ChannelType
  /** Resolved channel display fields (when channel_id is set). */
  channel_name?: string
  channel_handle?: string
  channel_is_verified?: boolean
  language?: string | null
  is_bot_generated?: boolean
  user_has_prayed?: boolean
  /** Whether the current viewer (logged-in) has flagged this dua. */
  user_has_flagged?: boolean
  /** Whether the current viewer (logged-in) has bookmarked this dua. */
  user_has_bookmarked?: boolean
  published: boolean
  flagged: boolean
}

export interface Category {
  id: number
  name: string
  description: string
  is_active: boolean
  sort_order: number
  channel_type: ChannelType
  status: ChannelStatus
  owner_id: string | null
  handle: string | null
  is_verified: boolean
  verified_at?: string | null
  reviewed_at?: string | null
  reviewed_by?: string | null
  created_at?: string
  updated_at?: string
}
