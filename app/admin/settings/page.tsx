import { redirect } from "next/navigation"
import { Settings2 } from "lucide-react"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminSettingsHub, isSettingsTabId } from "@/components/admin/admin-settings-hub"
import { getAdminDuaBotRuntimeStatus, listAdminDuaBots } from "@/app/actions/admin-bots"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { signInHref } from "@/lib/auth-modal"
import { getAiProviderAdminView } from "@/lib/ai-provider"
import { getPostingModeForAdmin } from "@/lib/posting-settings"

type PageProps = {
  searchParams: Promise<{ tab?: string }>
}

export default async function AdminSettingsPage({ searchParams }: PageProps) {
  const [{ tab }, ctx] = await Promise.all([searchParams, getAdminContext()])

  if (!ctx) redirect(signInHref({ next: "/admin/settings" }))

  const canManageSettings = ctx.isFoundingAdmin || hasPermission(ctx, "manage_settings")
  const canManageAdmins = ctx.isFoundingAdmin || hasPermission(ctx, "manage_admins")
  const canManageBots = ctx.isFoundingAdmin || hasPermission(ctx, "manage_duas")
  const canManageVolunteers = ctx.isFoundingAdmin || hasPermission(ctx, "manage_volunteers")

  if (!canManageSettings && !canManageAdmins && !canManageBots && !canManageVolunteers) {
    redirect(signInHref({ error: "not_admin" }))
  }

  const [postingMode, aiProvider, bots, botRuntimeStatus] = await Promise.all([
    canManageSettings ? getPostingModeForAdmin() : Promise.resolve("public" as const),
    canManageSettings ? getAiProviderAdminView() : Promise.resolve(null),
    canManageBots ? listAdminDuaBots() : Promise.resolve([]),
    canManageBots ? getAdminDuaBotRuntimeStatus() : Promise.resolve(null),
  ])

  return (
    <InnerPageLayout activePath="/admin/settings">
      <AdminPageHeader
        icon={Settings2}
        title="Settings"
        description="Control center for site content, posting access, AI Provider, bots, integrations, and roles."
      />

      <AdminSettingsHub
        initialTab={isSettingsTabId(tab) ? tab : "general"}
        postingMode={postingMode}
        aiProvider={aiProvider}
        bots={bots}
        botRuntimeStatus={botRuntimeStatus}
        canManageSettings={canManageSettings}
        canManageBots={canManageBots}
        canManageAdmins={canManageAdmins}
        canManageVolunteers={canManageVolunteers}
      />
    </InnerPageLayout>
  )
}
