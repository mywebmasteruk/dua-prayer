"use client"

import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "../types/database"

let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClientSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    )
  }
  return supabaseClient
}
