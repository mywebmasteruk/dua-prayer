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

export interface Category {
  id: number
  name: string
}
