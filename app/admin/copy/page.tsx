import { Megaphone, Type } from "lucide-react"
import { redirect } from "next/navigation"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminSection } from "@/components/admin/admin-section"
import { BetaBannerSettings } from "@/components/admin/beta-banner-settings"
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

      <div className="space-y-4">
        {ctx.isFoundingAdmin && betaBannerSettings ? (
          <details className="group rounded-xl border border-border/60 bg-background" open>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 marker:hidden">
              <span>
                <span className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
                  <Megaphone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  Beta top banner
                </span>
                <span className="mt-1 block text-sm font-normal text-muted-foreground">
                  Enable the site-wide beta notice, edit rich text, and set the background color.
                </span>
              </span>
              <span className="text-xs font-semibold text-muted-foreground group-open:hidden">Show</span>
              <span className="hidden text-xs font-semibold text-muted-foreground group-open:inline">Hide</span>
            </summary>
            <div className="border-t border-border/50 px-5 py-5">
              <BetaBannerSettings initialSettings={betaBannerSettings} />
            </div>
          </details>
        ) : null}

        <AdminSection title="Public text" description="Changes apply after you save.">
          <SiteCopySettings initialCopy={copy} />
        </AdminSection>
      </div>
    </InnerPageLayout>
  )
}
