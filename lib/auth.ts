import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

export async function getSession() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  const admin = createAdminSupabaseClient()
  const { data } = await admin.from("profiles").select("is_admin").eq("id", userId).single()
  return data?.is_admin === true
}

export async function requireAdmin() {
  const user = await getSession()
  if (!user) return { user: null, isAdmin: false as const }
  const isAdmin = await isUserAdmin(user.id)
  return { user, isAdmin }
}
