import { createClient } from "@supabase/supabase-js"
import type { WebSocketLikeConstructor } from "@supabase/realtime-js"
import ws from "ws"

export function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!url || !secret) {
    throw new Error("Missing Supabase admin credentials")
  }

  return createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
    // Server-only client — always use ws. Vercel Node 20 may expose a broken global WebSocket.
    realtime: { transport: ws as unknown as WebSocketLikeConstructor },
  })
}
