export interface Dua {
  id: number;
  text: string;
  user_id: string | null;
  category_id: number | null;
  channel_id: number | null;
  likes: number;
  created_at: string;
  category_name?: string;
  language?: string | null;
  user_has_prayed?: boolean;
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
}
