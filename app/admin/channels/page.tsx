import { LayoutGrid } from "lucide-react"
import { redirect } from "next/navigation"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminChannelsHub } from "@/components/admin/admin-channels-hub"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { listAdminChannels } from "@/app/actions/admin-channels"
import { listChannelApplications } from "@/app/actions/channel-applications"
import { getChannelFormRegistry } from "@/lib/site-settings-server"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { signInHref } from "@/lib/auth-modal"

export default async function AdminChannelsPage() {
  const ctx = await getAdminContext()
  if (!ctx) redirect(signInHref({ next: "/admin/channels" }))
  if (!hasPermission(ctx, "manage_channels")) redirect(signInHref({ error: "not_admin" }))

  const [channelsResult, applicationsResult, registry] = await Promise.all([
    listAdminChannels(),
    listChannelApplications({ status: "pending_review" }),
    getChannelFormRegistry(),
  ])

  const channels = "channels" in channelsResult ? channelsResult.channels : []
  const applications = "applications" in applicationsResult ? applicationsResult.applications : []

  return (
    <InnerPageLayout activePath="/admin/channels">
      <AdminPageHeader
        icon={LayoutGrid}
        title="Channels"
        description="Review community channel applications and manage approved channels."
      />

      <AdminChannelsHub initialApplications={applications} initialChannels={channels} registry={registry} />
    </InnerPageLayout>
  )
}
