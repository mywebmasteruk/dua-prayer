import { LayoutGrid } from "lucide-react"
import { redirect } from "next/navigation"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminChannelsSettings } from "@/components/admin/admin-channels-settings"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { listAdminChannels } from "@/app/actions/admin-channels"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { signInHref } from "@/lib/auth-modal"

export default async function AdminChannelsPage() {
  const ctx = await getAdminContext()
  if (!ctx) redirect(signInHref({ next: "/admin/channels" }))
  if (!hasPermission(ctx, "manage_channels")) redirect(signInHref({ error: "not_admin" }))

  const result = await listAdminChannels()
  const channels = "channels" in result ? result.channels : []

  return (
    <InnerPageLayout activePath="/admin/channels">
      <AdminPageHeader
        icon={LayoutGrid}
        title="Channels"
        description="Create and organize community channels. Active channels appear in the feed, composer, and channel browser."
      />

      <AdminChannelsSettings initialChannels={channels} />
    </InnerPageLayout>
  )
}
