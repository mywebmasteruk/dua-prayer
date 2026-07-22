"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { resetPassword } from "@/app/actions/auth"
import { signInHref } from "@/lib/auth-modal"

interface ForgotPasswordFormProps {
  next?: string
}

export function ForgotPasswordForm({ next }: ForgotPasswordFormProps) {
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    const result = await resetPassword(formData)
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else {
      setEmailSent(true)
    }
    setLoading(false)
  }

  if (emailSent) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 space-y-4 text-center">
          <p className="text-sm font-medium text-green-600">Check your email</p>
          <p className="text-sm text-muted-foreground">
            If an account exists for that address, we sent a password reset link.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href={next ? signInHref({ next }) : signInHref()}>
              Back to sign in
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-6">
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input
              id="reset-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="your@email.com"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href={next ? signInHref({ next }) : signInHref()}>
              Back to sign in
            </Link>
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
