import { Type } from "lucide-react"
import { redirect } from "next/navigation"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminSection } from "@/components/admin/admin-section"
import { SiteCopySettings } from "@/components/admin/site-copy-settings"
import { getSiteCopyForAdmin } from "@/app/actions/site-copy"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { signInHref } from "@/lib/auth-modal"

export default async function AdminCopyPage() {
  const ctx = await getAdminContext()
  if (!ctx) redirect(signInHref({ next: "/admin/copy" }))
  if (!hasPermission(ctx, "manage_settings")) redirect(signInHref({ error: "not_admin" }))

  const copy = await getSiteCopyForAdmin()

  return (
    <InnerPageLayout activePath="/admin/copy">
      <AdminPageHeader
        icon={Type}
        title="Site copy"
        backHref="/admin/settings"
        backLabel="Back to settings"
        description="Edit public-facing text on the sidebar, footer, and About page."
      />

      <AdminSection title="Public text" description="Changes apply after you save.">
        <SiteCopySettings initialCopy={copy} />
      </AdminSection>
    </InnerPageLayout>
  )
}
