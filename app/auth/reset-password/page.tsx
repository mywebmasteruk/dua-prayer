import { AuthLayout } from "@/components/auth-layout"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-xl font-semibold">Set a new password</h1>
        <ResetPasswordForm />
      </div>
    </AuthLayout>
  )
}
