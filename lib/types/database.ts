export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: number
          name: string
          description: string
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          display_name: string | null
          is_admin: boolean
          admin_role: "admin" | "moderator" | null
          admin_permissions: Json
          account_status: "active" | "pending_review" | "rejected"
          member_role: "volunteer" | "moderator" | "admin" | null
          volunteer_application: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          is_admin?: boolean
          admin_role?: "admin" | "moderator" | null
          admin_permissions?: Json
          account_status?: "active" | "pending_review" | "rejected"
          member_role?: "volunteer" | "moderator" | "admin" | null
          volunteer_application?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          is_admin?: boolean
          admin_role?: "admin" | "moderator" | null
          admin_permissions?: Json
          account_status?: "active" | "pending_review" | "rejected"
          member_role?: "volunteer" | "moderator" | "admin" | null
          volunteer_application?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      duas: {
        Row: {
          id: number
          text: string
          user_id: string | null
          category_id: number | null
          likes: number
          published: boolean
          flagged: boolean
          created_at: string
        }
        Insert: {
          id?: number
          text: string
          user_id?: string | null
          category_id?: number | null
          likes?: number
          published?: boolean
          flagged?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          text?: string
          user_id?: string | null
          category_id?: number | null
          likes?: number
          published?: boolean
          flagged?: boolean
        }
        Relationships: []
      }
      dua_prayers: {
        Row: { id: number; dua_id: number; user_id: string | null; voter_hash: string | null; created_at: string }
        Insert: { id?: number; dua_id: number; user_id?: string | null; voter_hash?: string | null; created_at?: string }
        Update: { id?: number; dua_id?: number; user_id?: string | null; voter_hash?: string | null }
        Relationships: []
      }
      site_settings: {
        Row: { key: string; value: string; updated_at: string }
        Insert: { key: string; value?: string; updated_at?: string }
        Update: { key?: string; value?: string; updated_at?: string }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      pray_for_dua: { Args: { p_dua_id: number; p_voter_hash?: string | null }; Returns: Json }
      increment_likes: { Args: { dua_id: number }; Returns: undefined }
      is_admin: { Args: Record<string, never>; Returns: boolean }
    }
    Enums: Record<string, never>
  }
}
