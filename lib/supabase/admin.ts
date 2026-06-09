import { createClient } from "@supabase/supabase-js"
import ws from "ws"
import type { Database } from "@/lib/types/database"

export function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!url || !secret) {
    throw new Error("Missing Supabase admin credentials")
  }

  return createClient<Database>(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
    // Node 20 on Vercel has no global WebSocket; Realtime init throws without a transport.
    realtime: typeof WebSocket === "undefined" ? { transport: ws } : undefined,
  })
}
