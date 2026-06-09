import { LayoutGrid } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminChannelsHub } from "@/components/admin/admin-channels-hub"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminSection } from "@/components/admin/admin-section"
import { ChannelFormSettings } from "@/components/admin/channel-form-settings"
import { listAdminChannels } from "@/app/actions/admin-channels"
import { listChannelApplications } from "@/app/actions/channel-applications"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { signInHref } from "@/lib/auth-modal"
import { getChannelFilloutSettingValue } from "@/lib/site-settings-server"

export default async function AdminChannelsPage() {
  const ctx = await getAdminContext()
  if (!ctx) redirect(signInHref({ next: "/admin/channels" }))
  if (!hasPermission(ctx, "manage_channels")) redirect(signInHref({ error: "not_admin" }))

  const [channelsResult, applicationsResult, filloutValue] = await Promise.all([
    listAdminChannels(),
    listChannelApplications({ status: "pending_review" }),
    getChannelFilloutSettingValue(),
  ])

  const channels = "channels" in channelsResult ? channelsResult.channels : []
  const applications = "applications" in applicationsResult ? applicationsResult.applications : []

  return (
    <InnerPageLayout activePath="/admin/channels">
      <AdminPageHeader
        icon={LayoutGrid}
        title="Channels"
        description="Review community channel applications, manage approved channels, and configure the optional external application form."
      />

      <AdminSection
        title="Channel application form"
        description={
          <>
            Optional Fillout embed for{" "}
            <Link href="/channels/apply" className="text-primary underline-offset-2 hover:underline">
              /channels/apply
            </Link>
            . Signed-in users can also submit in-app applications, which appear in the Applications tab below.
            {" "}
            For Fillout webhook setup, see{" "}
            <Link href="/admin/integration?tab=webhooks" className="text-primary underline-offset-2 hover:underline">
              Integration → Webhooks
            </Link>
            .
          </>
        }
        contentClassName="pt-0"
        className="mb-8"
      >
        <ChannelFormSettings initialValue={filloutValue} />
      </AdminSection>

      <AdminChannelsHub initialApplications={applications} initialChannels={channels} />
    </InnerPageLayout>
  )
}
