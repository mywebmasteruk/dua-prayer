import { Suspense } from "react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AuthLayout } from "@/components/auth-layout"
import { AuthForm } from "@/components/auth/auth-form"

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

  return (
    <AuthLayout>
      <Suspense fallback={null}>
        <AuthForm error={params.error} resetSuccess={params.reset === "success"} next={params.next} />
      </Suspense>
    </AuthLayout>
  )
}
