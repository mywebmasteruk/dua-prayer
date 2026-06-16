import { redirect } from "next/navigation"
import { BookOpen } from "lucide-react"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminDuaList } from "@/components/admin/admin-dua-list"
import { AdminFilters } from "@/components/admin/admin-filters"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { DuaBotControlPanel } from "@/components/admin/dua-bot-control-panel"
import { getCategories, getAdminDuas } from "../actions/duas"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { signInHref } from "@/lib/auth-modal"
import { getAdminDuaBotRuntimeStatus, listAdminDuaBots, listRecentAdminDuaBotRuns } from "@/app/actions/admin-bots"
import { cn } from "@/lib/utils"

function defaultAdminRedirect(ctx: NonNullable<Awaited<ReturnType<typeof getAdminContext>>>) {
  if (hasPermission(ctx, "manage_duas")) return null
  if (hasPermission(ctx, "manage_channels")) return "/admin/channels"
  if (hasPermission(ctx, "manage_users")) return "/admin/users"
  if (hasPermission(ctx, "manage_settings")) return "/admin/copy"
  if (hasPermission(ctx, "manage_volunteers")) return "/admin/volunteers"
  if (hasPermission(ctx, "manage_admins")) return "/admin/users/roles"
  if (hasPermission(ctx, "view_analytics")) return "/admin/volunteers/roles"
  return signInHref({ error: "not_admin" })
}

type Tab = "duas" | "bots"

function DuasTabBar({ activeTab }: { activeTab: Tab }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "duas", label: "Duas" },
    { id: "bots", label: "Dua bots" },
  ]
  return (
    <div
      className="flex overflow-x-auto border-b border-border/70 bg-background mb-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        const href = tab.id === "duas" ? "/admin" : "/admin?tab=bots"
        return (
          <a
            key={tab.id}
            href={href}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "relative shrink-0 px-4 py-3 text-sm transition hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:px-5 sm:text-[15px]",
              isActive ? "font-semibold text-foreground" : "font-normal text-muted-foreground",
            )}
          >
            {tab.label}
            {isActive ? (
              <span
                className="absolute bottom-0 left-1/2 h-0.5 w-[calc(100%-1rem)] max-w-24 -translate-x-1/2 rounded-full bg-primary"
                aria-hidden="true"
              />
            ) : null}
          </a>
        )
      })}
    </div>
  )
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; category?: string; language?: string; tab?: string }>
}) {
  const params = await searchParams
  const ctx = await getAdminContext()

  if (!ctx) redirect(signInHref({ next: "/admin" }))

  const redirectTo = defaultAdminRedirect(ctx)
  if (redirectTo) redirect(redirectTo)

  if (!hasPermission(ctx, "manage_duas")) redirect(signInHref({ error: "not_admin" }))

  const activeTab: Tab = params.tab === "bots" ? "bots" : "duas"

  const categories = await getCategories({ includeInactive: true })

  if (activeTab === "bots") {
    const [bots, runs, runtimeStatus] = await Promise.all([
      listAdminDuaBots(),
      listRecentAdminDuaBotRuns(8),
      getAdminDuaBotRuntimeStatus(),
    ])

    // Gate above guarantees access; the action returns null only when called
    // without manage_duas.
    if (!runtimeStatus) redirect(signInHref({ error: "not_admin" }))

    return (
      <InnerPageLayout activePath="/admin">
        <AdminPageHeader
          icon={BookOpen}
          title="Duas"
          description="Review, publish, and moderate community prayer requests."
        />
        <DuasTabBar activeTab="bots" />
        <DuaBotControlPanel initialBots={bots} recentRuns={runs} categories={categories} runtimeStatus={runtimeStatus} />
      </InnerPageLayout>
    )
  }

  const duas = await getAdminDuas({
    search: params.search,
    status: params.status,
    category: params.category,
    language: params.language,
  })

  return (
    <InnerPageLayout activePath="/admin">
      <AdminPageHeader
        icon={BookOpen}
        title="Duas"
        description="Review, publish, and moderate community prayer requests."
      />
      <DuasTabBar activeTab="duas" />
      <AdminFilters categories={categories} resultCount={duas.length} />
      <AdminDuaList initialDuas={duas} categories={categories} />
    </InnerPageLayout>
  )
}
