"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
}

function buildCallbackUrl(next?: string) {
  const url = new URL("/auth/callback", getAppUrl())
  if (next) url.searchParams.set("next", next)
  return url.toString()
}

async function resolvePostAuthRedirect(next: string, userId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single()

  const wantsAdmin = next === "/admin" || next.startsWith("/admin")
  if (wantsAdmin) {
    if (profile?.is_admin) return "/admin"
    return "/auth?error=not_admin"
  }

  if (profile?.is_admin && next === "/") return "/admin"
  return next || "/"
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const next = (formData.get("next") as string) || "/"

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }

  const destination = await resolvePostAuthRedirect(next, data.user.id)
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
      shouldCreateUser: false,
    },
  })

  if (error) return { error: error.message }
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

  redirect("/auth?reset=success")
}
