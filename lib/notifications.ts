import { createAdminSupabaseClient } from "@/lib/supabase/admin"

export const NOTIFICATION_TYPES = [
  "volunteer_status",
  "channel_application",
  "dua_status",
] as const
export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

/**
 * Inserts an in-app notification for a user. Best-effort: a failure here must
 * never break the parent action (e.g. approving a volunteer), so errors are
 * logged and swallowed. Skips when there is no recipient (e.g. bot/anonymous
 * dua with a null author).
 */
export async function createNotification(input: {
  userId: string | null | undefined
  type: NotificationType
  title: string
  body?: string | null
  href?: string | null
}): Promise<void> {
  if (!input.userId) return

  const admin = createAdminSupabaseClient()
  const { error } = await admin.from("notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    href: input.href ?? null,
  })
  if (error) console.error("Failed to create notification:", error)
}
