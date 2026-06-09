export interface Dua {
  id: number
  text: string
  user_id: string | null
  category_id: number | null
  likes: number
  created_at: string
  category_name?: string
  user_has_prayed?: boolean
  user_has_liked?: boolean
  published: boolean
  flagged: boolean
}

import type { ChannelStatus, ChannelType } from "@/lib/channel-types"

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
