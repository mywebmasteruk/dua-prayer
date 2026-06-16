"use server"

import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { getServerUser } from "@/lib/server-user"
import type { NotificationType } from "@/lib/notifications"

export type NotificationRecord = {
  id: number
  type: NotificationType
  title: string
  body: string | null
  href: string | null
  readAt: string | null
  createdAt: string
}

export async function getUnreadNotificationCount(): Promise<number> {
  const user = await getServerUser()
  if (!user) return 0

  const admin = createAdminSupabaseClient()
  const { count, error } = await admin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null)

  if (error) {
    console.error("Error counting notifications:", error)
    return 0
  }
  return count ?? 0
}

export async function listMyNotifications(): Promise<
  { notifications: NotificationRecord[] } | { error: string }
> {
  const user = await getServerUser()
  if (!user) return { error: "Unauthorized" }

  const admin = createAdminSupabaseClient()
  const { data, error } = await admin
    .from("notifications")
    .select("id, type, title, body, href, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) return { error: error.message }

  const notifications: NotificationRecord[] = (data ?? []).map((row) => ({
    id: row.id,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    href: row.href,
    readAt: row.read_at,
    createdAt: row.created_at,
  }))

  return { notifications }
}

export async function markAllNotificationsRead(): Promise<{ success: true } | { error: string }> {
  const user = await getServerUser()
  if (!user) return { error: "Unauthorized" }

  const admin = createAdminSupabaseClient()
  const { error } = await admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null)

  if (error) return { error: error.message }

  revalidatePath("/notifications")
  revalidatePath("/")
  return { success: true }
}
