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
          channel_type: "category" | "user"
          status: "approved" | "pending_review" | "rejected"
          owner_id: string | null
          handle: string | null
          is_verified: boolean
          verified_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          application: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string
          is_active?: boolean
          sort_order?: number
          channel_type?: "category" | "user"
          status?: "approved" | "pending_review" | "rejected"
          owner_id?: string | null
          handle?: string | null
          is_verified?: boolean
          verified_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          application?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string
          is_active?: boolean
          sort_order?: number
          channel_type?: "category" | "user"
          status?: "approved" | "pending_review" | "rejected"
          owner_id?: string | null
          handle?: string | null
          is_verified?: boolean
          verified_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          application?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          display_name: string | null
          is_admin: boolean
          admin_role: "admin" | "moderator" | "volunteer" | null
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
          admin_role?: "admin" | "moderator" | "volunteer" | null
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
          admin_role?: "admin" | "moderator" | "volunteer" | null
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
          language: string | null
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
          language?: string | null
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
          language?: string | null
        }
        Relationships: []
      }
      dua_prayers: {
        Row: { id: number; dua_id: number; user_id: string | null; voter_hash: string | null; created_at: string }
        Insert: { id?: number; dua_id: number; user_id?: string | null; voter_hash?: string | null; created_at?: string }
        Update: { id?: number; dua_id?: number; user_id?: string | null; voter_hash?: string | null }
        Relationships: []
      }
      dua_flags: {
        Row: { id: number; dua_id: number; user_id: string; created_at: string }
        Insert: { id?: number; dua_id: number; user_id: string; created_at?: string }
        Update: { id?: number; dua_id?: number; user_id?: string; created_at?: string }
        Relationships: []
      }
      bookmarks: {
        Row: { id: number; dua_id: number; user_id: string; created_at: string }
        Insert: { id?: number; dua_id: number; user_id: string; created_at?: string }
        Update: { id?: number; dua_id?: number; user_id?: string; created_at?: string }
        Relationships: []
      }
      notifications: {
        Row: {
          id: number
          user_id: string
          type: string
          title: string
          body: string | null
          href: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          type: string
          title: string
          body?: string | null
          href?: string | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          type?: string
          title?: string
          body?: string | null
          href?: string | null
          read_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      dua_bots: {
        Row: {
          id: number
          name: string
          description: string
          system_prompt: string | null
          status: "active" | "paused"
          frequency_minutes: number
          max_duas_per_run: number
          source_type: "rss"
          rss_urls: string[]
          keywords: string[]
          categories: string[]
          tone: string
          language: string
          target_category_id: number | null
          publish_mode: "pending" | "published"
          last_run_at: string | null
          next_run_at: string | null
          last_status: "never_run" | "success" | "error" | "skipped"
          last_error: string | null
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string
          system_prompt?: string | null
          status?: "active" | "paused"
          frequency_minutes?: number
          max_duas_per_run?: number
          source_type?: "rss"
          rss_urls?: string[]
          keywords?: string[]
          categories?: string[]
          tone?: string
          language?: string
          target_category_id?: number | null
          publish_mode?: "pending" | "published"
          last_run_at?: string | null
          next_run_at?: string | null
          last_status?: "never_run" | "success" | "error" | "skipped"
          last_error?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string
          system_prompt?: string | null
          status?: "active" | "paused"
          frequency_minutes?: number
          max_duas_per_run?: number
          source_type?: "rss"
          rss_urls?: string[]
          keywords?: string[]
          categories?: string[]
          tone?: string
          language?: string
          target_category_id?: number | null
          publish_mode?: "pending" | "published"
          last_run_at?: string | null
          next_run_at?: string | null
          last_status?: "never_run" | "success" | "error" | "skipped"
          last_error?: string | null
          created_by?: string | null
          updated_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dua_bot_runs: {
        Row: {
          id: number
          bot_id: number
          started_at: string
          finished_at: string | null
          status: "running" | "success" | "error" | "skipped"
          events_found: number
          duas_created: number
          message: string | null
          ai_provider: string | null
          ai_model: string | null
        }
        Insert: {
          id?: number
          bot_id: number
          started_at?: string
          finished_at?: string | null
          status?: "running" | "success" | "error" | "skipped"
          events_found?: number
          duas_created?: number
          message?: string | null
          ai_provider?: string | null
          ai_model?: string | null
        }
        Update: {
          id?: number
          bot_id?: number
          finished_at?: string | null
          status?: "running" | "success" | "error" | "skipped"
          events_found?: number
          duas_created?: number
          message?: string | null
          ai_provider?: string | null
          ai_model?: string | null
        }
        Relationships: []
      }
      dua_bot_event_posts: {
        Row: {
          id: number
          bot_id: number
          run_id: number | null
          dua_id: number | null
          event_key: string
          event_title: string
          event_url: string | null
          event_published_at: string | null
          source_type: string
          source_url: string | null
          created_at: string
        }
        Insert: {
          id?: number
          bot_id: number
          run_id?: number | null
          dua_id?: number | null
          event_key: string
          event_title: string
          event_url?: string | null
          event_published_at?: string | null
          source_type?: string
          source_url?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          bot_id?: number
          run_id?: number | null
          dua_id?: number | null
          event_key?: string
          event_title?: string
          event_url?: string | null
          event_published_at?: string | null
          source_type?: string
          source_url?: string | null
        }
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
    Enums: {
      channel_type: "category" | "user"
      channel_status: "approved" | "pending_review" | "rejected"
    }
    CompositeTypes: Record<string, never>
  }
}
