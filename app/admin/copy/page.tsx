import { Type } from "lucide-react"
import { redirect } from "next/navigation"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminSection } from "@/components/admin/admin-section"
import { SiteCopySettings } from "@/components/admin/site-copy-settings"
import { getBetaBannerSettingsForSuperAdmin } from "@/app/actions/settings"
import { getSiteCopyForAdmin } from "@/app/actions/site-copy"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { signInHref } from "@/lib/auth-modal"

export default async function AdminCopyPage() {
  const ctx = await getAdminContext()
  if (!ctx) redirect(signInHref({ next: "/admin/copy" }))
  if (!hasPermission(ctx, "manage_settings")) redirect(signInHref({ error: "not_admin" }))

  const [copy, betaBannerSettings] = await Promise.all([
    getSiteCopyForAdmin(),
    ctx.isFoundingAdmin ? getBetaBannerSettingsForSuperAdmin() : Promise.resolve(null),
  ])

  return (
    <InnerPageLayout activePath="/admin/copy">
      <AdminPageHeader
        icon={Type}
        title="Site Content"
        backHref="/admin/settings"
        backLabel="Back to settings"
        description="Edit public-facing content, including the beta top banner and page text."
      />

      <AdminSection
        title="Public text"
        description="Group copy by page or parent section, then edit translations side by side. Changes apply after you save."
        contentClassName="space-y-5"
      >
        <SiteCopySettings initialCopy={copy} betaBannerSettings={ctx.isFoundingAdmin ? betaBannerSettings : null} />
      </AdminSection>
    </InnerPageLayout>
  )
}
