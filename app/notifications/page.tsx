import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, Bell } from "lucide-react"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { signInHref } from "@/lib/auth-modal"
import { getServerUser } from "@/lib/server-user"

export default async function NotificationsPage() {
  const user = await getServerUser()
  if (!user) redirect(signInHref({ next: "/notifications" }))

  return (
    <InnerPageLayout activePath="/notifications" contentClassName="max-w-2xl">
      <Card className="rounded-3xl border-border/70 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bell className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <CardTitle className="text-2xl tracking-[-0.03em]">Notifications</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Updates about your activity will appear here.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-2xl bg-muted/45 p-4">
            <p className="text-sm font-semibold text-foreground">No notifications yet</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              When people respond to your duas or your account status changes, updates will be shown here.
            </p>
          </div>
          <Button asChild className="rounded-full">
            <Link href="/account">
              Review account status
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </InnerPageLayout>
  )
}
