import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, User } from "lucide-react"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { signInHref } from "@/lib/auth-modal"
import { getServerUser } from "@/lib/server-user"

export default async function ProfilePage() {
  const user = await getServerUser()
  if (!user) redirect(signInHref({ next: "/profile" }))

  const displayName =
    (typeof user.user_metadata?.display_name === "string" && user.user_metadata.display_name) ||
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
    user.email ||
    "DuaPrayer member"

  return (
    <InnerPageLayout activePath="/profile" contentClassName="max-w-2xl">
      <Card className="rounded-3xl border-border/70 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <CardTitle className="text-2xl tracking-[-0.03em]">Profile</CardTitle>
              <p className="mt-1 truncate text-sm text-muted-foreground" title={user.email ?? undefined}>
                {user.email}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-2xl bg-muted/45 p-4">
            <p className="text-sm font-semibold text-foreground">{displayName}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Your public profile tools are being prepared. For now, use your account page to review status and settings.
            </p>
          </div>
          <Button asChild className="rounded-full">
            <Link href="/account">
              Open account settings
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </InnerPageLayout>
  )
}
