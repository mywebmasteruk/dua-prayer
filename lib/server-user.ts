import { cache } from "react"
import type { User } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/lib/supabase/server"

/** One auth.getUser() per request — shared by layout, pages, and getSession(). */
export const getServerUser = cache(async (): Promise<User | null> => {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})
