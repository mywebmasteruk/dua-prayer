import { LayoutGrid } from "lucide-react"
import { redirect } from "next/navigation"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminNav } from "@/components/admin/admin-nav"
import { AdminChannelsSettings } from "@/components/admin/admin-channels-settings"
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
    <InnerPageLayout activePath="/admin" contentClassName="max-w-[691px]">
      <div className="mb-2 flex items-center gap-2">
        <LayoutGrid className="h-6 w-6 text-primary" aria-hidden="true" />
        <h1 className="text-2xl font-semibold">Channels</h1>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Create and organize community channels. Active channels appear in the feed, composer, and channel browser.
      </p>

      <AdminNav permissions={ctx.permissions} isFoundingAdmin={ctx.isFoundingAdmin} active="channels" />

      <AdminChannelsSettings initialChannels={channels} />
    </InnerPageLayout>
  )
}
