import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import type { User } from "@supabase/supabase-js"

const PER_PAGE = 200

/**
 * Collect every auth user via the paged admin API. On a page error, returns
 * what was collected so far plus the error message — callers decide whether
 * partial data is acceptable.
 */
export async function listAllAuthUsers(): Promise<{ users: User[]; error: string | null }> {
  const admin = createAdminSupabaseClient()
  const users: User[] = []
  let page = 1

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE })
    if (error) return { users, error: error.message }

    users.push(...data.users)
    if (data.users.length < PER_PAGE) break
    page += 1
  }

  return { users, error: null }
}

/** Case-insensitive email lookup over the paged admin API; stops at first match. */
export async function findAuthUserIdByEmail(
  email: string,
): Promise<{ userId: string | null; error: string | null }> {
  const normalized = email.trim().toLowerCase()
  const admin = createAdminSupabaseClient()
  let page = 1

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE })
    if (error) return { userId: null, error: error.message }

    const match = data.users.find((user) => user.email?.toLowerCase() === normalized)
    if (match) return { userId: match.id, error: null }

    if (data.users.length < PER_PAGE) break
    page += 1
  }

  return { userId: null, error: null }
}
