"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { markAllNotificationsRead } from "@/app/actions/notifications"

/**
 * Marks all of the viewer's notifications as read once, on mount, then refreshes
 * so the nav unread badge clears. Rendered only when there are unread items.
 */
export function NotificationsMarkRead() {
  const router = useRouter()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    void markAllNotificationsRead().then(() => router.refresh())
  }, [router])

  return null
}
