"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { signIn, sendMagicLink } from "@/app/actions/auth"
import { createClientSupabaseClient } from "@/lib/supabase/client"

interface AuthFormProps {
  error?: string
  resetSuccess?: boolean
  next?: string
  onMagicLinkSuccess?: () => void
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

export function AuthForm({ error, resetSuccess, next, onMagicLinkSuccess }: AuthFormProps) {
  const [loading, setLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [magicLinkClosing, setMagicLinkClosing] = useState(false)

  useEffect(() => {
    if (!magicLinkSent) return

    const fadeTimer = window.setTimeout(() => setMagicLinkClosing(true), 2600)
    const closeTimer = window.setTimeout(() => {
      onMagicLinkSuccess?.()
      setMagicLinkSent(false)
      setMagicLinkClosing(false)
    }, 3200)

    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(closeTimer)
    }
  }, [magicLinkSent, onMagicLinkSuccess])

  if (error === "not_admin") {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center text-destructive">
          You do not have admin access. Contact an administrator.
        </CardContent>
      </Card>
    )
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      const supabase = createClientSupabaseClient()
      const redirectTo = new URL("/auth/callback", window.location.origin)
      if (next) redirectTo.searchParams.set("next", next)

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectTo.toString() },
      })

      if (oauthError) {
        toast({ title: "Error", description: oauthError.message, variant: "destructive" })
        setLoading(false)
      }
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Could not start Google sign-in",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const handleSignIn = async (formData: FormData) => {
    setLoading(true)
    if (next) formData.set("next", next)
    try {
      const result = await signIn(formData)
      if (result?.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) {
        throw e
      }
      if (e instanceof Error) {
        toast({ title: "Error", description: e.message, variant: "destructive" })
      }
    }
    setLoading(false)
  }

  const handleMagicLink = async (formData: FormData) => {
    setLoading(true)
    if (next) formData.set("next", next)
    const result = await sendMagicLink(formData)
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else {
      setMagicLinkSent(true)
    }
    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center text-xl" role="heading" aria-level={2}>
          Log in or create an account
        </CardTitle>
        <CardDescription className="text-center text-sm leading-6">
          Log in to save your activity, follow channels, and access more features.
          New here? Continue with Google or magic link to create your account.
        </CardDescription>
        {resetSuccess && (
          <p className="text-sm text-green-600 text-center">Password updated. You can sign in now.</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <GoogleIcon />
          Continue with Google
        </Button>

        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            or
          </span>
        </div>

        <Tabs defaultValue="password">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="magic-link">Magic link</TabsTrigger>
          </TabsList>

          <TabsContent value="password" className="mt-4 space-y-4">
            <form action={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="signin-password">Password</Label>
                  <Link
                    href={next ? `/auth/forgot-password?next=${encodeURIComponent(next)}` : "/auth/forgot-password"}
                    className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="signin-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="magic-link" className="mt-4">
            {magicLinkSent ? (
              <div className={`space-y-3 py-2 text-center transition-opacity duration-500 ${magicLinkClosing ? "opacity-0" : "opacity-100"}`}>
                <p className="text-sm font-medium text-green-600">Check your email</p>
                <p className="text-sm text-muted-foreground">
                  We sent a sign-in link. Click it in your email to continue.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMagicLinkClosing(false)
                    setMagicLinkSent(false)
                  }}
                >
                  Use a different email
                </Button>
              </div>
            ) : (
              <form action={handleMagicLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="magic-email">Email</Label>
                  <Input
                    id="magic-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send magic link"}
                </Button>
              </form>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
