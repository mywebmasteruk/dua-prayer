import { redirect } from "next/navigation"
import { Bot } from "lucide-react"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { DuaBotControlPanel } from "@/components/admin/dua-bot-control-panel"
import { getCategories } from "@/app/actions/duas"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { getAdminDuaBotRuntimeStatus, listAdminDuaBots, listRecentAdminDuaBotRuns } from "@/app/actions/admin-bots"
import { signInHref } from "@/lib/auth-modal"

export default async function AdminBotsPage() {
  const ctx = await getAdminContext()
  if (!ctx) redirect(signInHref({ next: "/admin/bots" }))
  if (!hasPermission(ctx, "manage_duas")) redirect(signInHref({ error: "not_admin" }))

  const [bots, runs, categories, runtimeStatus] = await Promise.all([
    listAdminDuaBots(),
    listRecentAdminDuaBotRuns(8),
    getCategories({ includeInactive: true }),
    getAdminDuaBotRuntimeStatus(),
  ])

  return (
    <InnerPageLayout activePath="/admin/bots">
      <AdminPageHeader
        icon={Bot}
        title="Dua bots"
        description="Create and control event-aware bots that monitor RSS/news sources and draft relevant duas for the Ummah."
      />

      <DuaBotControlPanel initialBots={bots} recentRuns={runs} categories={categories} runtimeStatus={runtimeStatus} />
    </InnerPageLayout>
  )
}
