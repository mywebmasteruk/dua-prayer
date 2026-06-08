import { Suspense } from "react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AuthForm } from "@/components/auth/auth-form"
import { BrandLogo } from "@/components/brand-logo"

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
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-6">
        <BrandLogo variant="wide" href="/" className="h-14 w-auto" priority />
        <p className="text-muted-foreground text-sm text-center max-w-sm">
          Sign in to access the admin dashboard. Public dua sharing does not require an account.
        </p>
        <Suspense fallback={null}>
          <AuthForm error={params.error} resetSuccess={params.reset === "success"} next={params.next} />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
