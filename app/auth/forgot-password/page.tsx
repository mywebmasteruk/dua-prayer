import { Suspense } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BrandLogo } from "@/components/brand-logo"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={null} />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-6">
        <BrandLogo variant="wide" href="/" className="h-14 w-auto" priority />
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold">Reset your password</h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            Enter your email and we&apos;ll send you a link to choose a new password.
          </p>
        </div>
        <Suspense fallback={null}>
          <ForgotPasswordForm next={params.next} />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
