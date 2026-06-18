"use server"

import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { getServerUser } from "@/lib/server-user"

/** Channel ids the current user follows (empty for guests — follows are account-tied). */
export async function listMyFollowIds(): Promise<number[]> {
  const user = await getServerUser()
  if (!user) return []

  const admin = createAdminSupabaseClient()
  const { data, error } = await admin.from("user_follows").select("channel_id").eq("user_id", user.id)
  if (error) {
    console.error("Error loading follows:", error)
    return []
  }
  return (data ?? []).map((row) => row.channel_id)
}

export async function followChannel(channelId: number) {
  const user = await getServerUser()
  if (!user) return { error: "Sign in to follow channels." }
  if (!Number.isInteger(channelId)) return { error: "Invalid channel." }

  const admin = createAdminSupabaseClient()
  const { error } = await admin
    .from("user_follows")
    .upsert({ user_id: user.id, channel_id: channelId }, { onConflict: "user_id,channel_id" })
  if (error) return { error: error.message }
  return { success: true as const }
}

export async function unfollowChannel(channelId: number) {
  const user = await getServerUser()
  if (!user) return { error: "Sign in to follow channels." }
  if (!Number.isInteger(channelId)) return { error: "Invalid channel." }

  const admin = createAdminSupabaseClient()
  const { error } = await admin.from("user_follows").delete().eq("user_id", user.id).eq("channel_id", channelId)
  if (error) return { error: error.message }
  return { success: true as const }
}
