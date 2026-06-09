"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { isFoundingAdminUser, resolveAdminLandingPath, userHasAdminAccess } from "@/lib/auth"
import { mapAuthErrorMessage } from "@/lib/auth-errors"
import { signInHref } from "@/lib/auth-modal"

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
}

function buildCallbackUrl(next?: string) {
  const url = new URL("/auth/callback", getAppUrl())
  if (next) url.searchParams.set("next", next)
  return url.toString()
}

async function resolvePostAuthRedirect(next: string, userId: string, email?: string | null) {
  const user = { id: userId, email }
  const wantsAdmin = next === "/admin" || next.startsWith("/admin")

  if (wantsAdmin) {
    const hasAccess = await userHasAdminAccess(user)
    if (!hasAccess) return signInHref({ error: "not_admin" })
    if (next === "/admin" || next === "/admin/") return resolveAdminLandingPath(user)
    return next
  }

  if ((await userHasAdminAccess(user)) && next === "/") {
    return resolveAdminLandingPath(user)
  }
  return next || "/"
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const next = (formData.get("next") as string) || "/"

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }

  const destination = await resolvePostAuthRedirect(next, data.user.id, data.user.email)
  revalidatePath("/")
  redirect(destination)
}

export async function sendMagicLink(formData: FormData) {
  const email = formData.get("email") as string
  const next = (formData.get("next") as string) || "/"

  if (!email) return { error: "Email is required" }

  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: buildCallbackUrl(next),
      shouldCreateUser: true,
    },
  })

  if (error) return { error: mapAuthErrorMessage(error.message) }
  return { success: true, message: "Check your email for the sign-in link." }
}

export async function signOut() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  revalidatePath("/")
  redirect("/")
}

export async function resetPassword(formData: FormData) {
  const email = formData.get("email") as string
  if (!email) return { error: "Email is required" }

  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getAppUrl()}/auth/reset-password`,
  })

  if (error) return { error: error.message }
  return { success: true, message: "Check your email for the reset link." }
}

export async function updatePassword(formData: FormData) {
  const password = formData.get("password") as string
  if (!password || password.length < 8) return { error: "Password must be at least 8 characters" }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }

  redirect(signInHref({ reset: "success" }))
}
