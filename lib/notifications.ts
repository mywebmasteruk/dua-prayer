import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { buildNotificationEmail, sendEmail } from "@/lib/email"

export const NOTIFICATION_TYPES = [
  "volunteer_status",
  "channel_application",
  "dua_status",
  "ameen_milestone",
] as const
export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

/** Ameen counts that trigger a one-time milestone notification to the author. */
export const AMEEN_MILESTONES = [10, 25, 50, 100, 250, 500, 1000] as const

/**
 * Returns the milestone a dua just reached, or null. Because `pray_for_dua` is
 * atomic, each integer count is returned exactly once across all prayers, so an
 * exact-equality check fires each milestone at most once — no dedupe needed.
 */
export function crossedAmeenMilestone(newLikes: number): number | null {
  return (AMEEN_MILESTONES as readonly number[]).includes(newLikes) ? newLikes : null
}

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
  /** Also send a transactional email (used for account-level events). */
  email?: boolean
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

  // Best-effort email — never blocks or breaks the parent action.
  if (input.email) {
    try {
      const { data } = await admin.auth.admin.getUserById(input.userId)
      const to = data.user?.email
      if (to) {
        const { subject, html, text } = buildNotificationEmail({
          title: input.title,
          body: input.body,
          href: input.href,
        })
        await sendEmail({ to, subject, html, text })
      }
    } catch (err) {
      console.error("Notification email failed:", err)
    }
  }
}
