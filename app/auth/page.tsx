import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { signInHref } from "@/lib/auth-modal"

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string; next?: string }>
}) {
  const params = await searchParams
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user && params.next === "/admin") redirect("/admin")
  if (user) redirect("/")

  redirect(
    signInHref({
      next: params.next,
      error: params.error,
      reset: params.reset === "success" ? "success" : undefined,
    }),
  )
}
