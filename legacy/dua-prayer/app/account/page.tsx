import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, Home, LayoutGrid, MailCheck } from "lucide-react"
import { signOut } from "@/app/actions/auth"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { accountStatusSignInMessage, getProfileAccessState } from "@/lib/account-status"
import { signInHref } from "@/lib/auth-modal"
import { getServerUser } from "@/lib/server-user"
import { ACCOUNT_STATUS_LABELS } from "@/lib/volunteer-types"
import { getCategories } from "@/app/actions/duas"
import { getMyPreferences } from "@/app/actions/preferences"
import { PreferencesForm } from "@/components/account/preferences-form"

export default async function AccountPage() {
  const user = await getServerUser()
  if (!user) redirect(signInHref({ next: "/account" }))

  const access = await getProfileAccessState(user.id)
  const status = access?.accountStatus ?? "active"
  const statusMessage = accountStatusSignInMessage(status)
  const isActive = status === "active"

  const [preferences, categories] = await Promise.all([getMyPreferences(), getCategories()])
  const topicCategories = categories.filter((c) => c.channel_type === "category")

  return (
    <InnerPageLayout activePath="/account" contentClassName="max-w-2xl">
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-medium text-primary">Account</p>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground">Your DuaPrayer status</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            You are signed in. This page shows your current account and volunteer access status.
          </p>
        </header>

        <Card className="overflow-hidden rounded-3xl border-border/70 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
          <CardHeader className="border-b border-border/60 bg-muted/30">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MailCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <CardTitle className="text-xl tracking-tight">{isActive ? "Account active" : ACCOUNT_STATUS_LABELS[status]}</CardTitle>
                <p className="mt-1 truncate text-sm text-muted-foreground" title={user.email ?? undefined}>
                  {user.email}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
              <p className="text-sm font-semibold text-foreground">
                {isActive ? "Your account is ready to use." : statusMessage}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {isActive
                  ? "You can browse duas, support requests, follow updates, and apply for a community channel."
                  : "You can stay signed in and return here any time. We will email you when your account is activated."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button asChild variant="outline" className="h-auto justify-between rounded-full px-4 py-3">
                <Link href="/">
                  <span className="inline-flex items-center gap-2">
                    <Home className="h-4 w-4" aria-hidden="true" />
                    Home
                  </span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto justify-between rounded-full px-4 py-3">
                <Link href="/channels">
                  <span className="inline-flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                    Channels
                  </span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <form action={signOut}>
              <Button type="submit" variant="ghost" className="rounded-full text-muted-foreground hover:text-foreground">
                Sign out or use a different account
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-3xl border-border/70 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
          <CardHeader className="border-b border-border/60 bg-muted/30">
            <CardTitle className="text-xl tracking-tight">Preferences</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Personalise your feed, topics, and followed channels.</p>
          </CardHeader>
          <CardContent className="p-6">
            <PreferencesForm
              initialLanguages={preferences.languages}
              initialTopics={preferences.topics}
              topicCategories={topicCategories}
              allChannels={categories}
            />
          </CardContent>
        </Card>
      </div>
    </InnerPageLayout>
  )
}
