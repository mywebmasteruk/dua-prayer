import { Suspense } from "react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AuthForm } from "@/components/auth/auth-form"

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string; next?: string }>
}) {
  const params = await searchParams
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user && params.next === "/admin") redirect("/admin")
  if (user) redirect("/")

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={null} />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <Suspense fallback={null}>
          <AuthForm error={params.error} resetSuccess={params.reset === "success"} next={params.next} />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
