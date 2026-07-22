import { cache } from "react"
import type { User } from "@supabase/supabase-js"
import { isFoundingAdminUser, isUserAdmin } from "@/lib/auth"
import { getServerUser } from "@/lib/server-user"

/** Lightweight admin flag for nav — avoids requireAdmin's extra getUser + profile round-trip. */
export const getServerUserAdminFlag = cache(async (): Promise<{ user: User | null; isAdmin: boolean }> => {
  const user = await getServerUser()
  if (!user) return { user: null, isAdmin: false }
  if (isFoundingAdminUser(user)) return { user, isAdmin: true }
  const isAdmin = await isUserAdmin(user.id, user.email)
  return { user, isAdmin }
})
