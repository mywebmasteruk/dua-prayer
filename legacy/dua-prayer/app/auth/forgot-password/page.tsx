import { Suspense } from "react"
import { AuthLayout } from "@/components/auth-layout"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const params = await searchParams

  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-6">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold">Reset your password</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a link to choose a new password.
          </p>
        </div>
        <Suspense fallback={null}>
          <ForgotPasswordForm next={params.next} />
        </Suspense>
      </div>
    </AuthLayout>
  )
}
