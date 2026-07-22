export interface Dua {
  id: number;
  text: string;
  user_id: string | null;
  category_id: number | null;
  channel_id: number | null;
  likes: number;
  created_at: string;
  category_name?: string;
  channel_name?: string;
  channel_handle?: string;
  channel_is_verified?: boolean;
  language?: string | null;
  user_has_prayed?: boolean;
  user_has_flagged?: boolean;
  user_has_bookmarked?: boolean;
  published: boolean;
  flagged: boolean;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  channel_type: 'category' | 'user';
  status: 'approved' | 'pending_review' | 'rejected';
  owner_id: string | null;
  handle: string | null;
  is_verified: boolean;
  dua_count?: number;
  ameen_count?: number;
}

export interface ChannelItem {
  id: number;
  name: string;
  handle: string;
  description: string;
  channelType: 'category' | 'user';
  isVerified: boolean;
  duaCount: number;
  ameenCount: number;
  sortOrder: number;
}
