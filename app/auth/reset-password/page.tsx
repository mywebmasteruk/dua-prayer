import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BrandLogo } from "@/components/brand-logo"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={null} />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-6">
        <BrandLogo variant="wide" href="/" className="h-14 w-auto" />
        <h1 className="text-xl font-semibold">Set a new password</h1>
        <ResetPasswordForm />
      </main>
      <Footer />
    </div>
  )
}
