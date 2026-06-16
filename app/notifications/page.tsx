import Link from "next/link"
import { redirect } from "next/navigation"
import { Bell, HandHeart, Heart, LayoutGrid, ShieldCheck } from "lucide-react"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { NotificationsMarkRead } from "@/components/notifications-mark-read"
import { listMyNotifications, type NotificationRecord } from "@/app/actions/notifications"
import type { NotificationType } from "@/lib/notifications"
import { signInHref } from "@/lib/auth-modal"
import { getServerUser } from "@/lib/server-user"
import { cn } from "@/lib/utils"

const TYPE_ICON: Record<NotificationType, typeof Bell> = {
  volunteer_status: HandHeart,
  channel_application: LayoutGrid,
  dua_status: ShieldCheck,
  ameen_milestone: Heart,
}

function relativeTime(value: string) {
  const then = new Date(value).getTime()
  if (Number.isNaN(then)) return ""
  const diffMs = Date.now() - then
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

function NotificationRow({ n }: { n: NotificationRecord }) {
  const Icon = TYPE_ICON[n.type] ?? Bell
  const unread = !n.readAt

  const inner = (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-border/60 p-4 transition",
        unread ? "bg-primary/5" : "bg-card",
        n.href && "hover:border-border hover:bg-muted/40",
      )}
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-foreground">{n.title}</p>
          {unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" /> : null}
        </div>
        {n.body ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{n.body}</p> : null}
        <p className="mt-1.5 text-xs text-muted-foreground/80">{relativeTime(n.createdAt)}</p>
      </div>
    </div>
  )

  return n.href ? (
    <Link href={n.href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl">
      {inner}
    </Link>
  ) : (
    inner
  )
}

export default async function NotificationsPage() {
  const user = await getServerUser()
  if (!user) redirect(signInHref({ next: "/notifications" }))

  const result = await listMyNotifications()
  const notifications = "notifications" in result ? result.notifications : []
  const hasUnread = notifications.some((n) => !n.readAt)

  return (
    <InnerPageLayout activePath="/notifications" contentClassName="max-w-2xl">
      {hasUnread ? <NotificationsMarkRead /> : null}

      <header className="border-b border-border/50 pb-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bell className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.03em]">Notifications</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Updates about your account, channels, and duas.
            </p>
          </div>
        </div>
      </header>

      {notifications.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-muted/45 p-5">
          <p className="text-sm font-semibold text-foreground">No notifications yet</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            When your account status changes, a channel application is reviewed, or one of your duas
            is published or removed, you&apos;ll see it here.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {notifications.map((n) => (
            <li key={n.id}>
              <NotificationRow n={n} />
            </li>
          ))}
        </ul>
      )}
    </InnerPageLayout>
  )
}
