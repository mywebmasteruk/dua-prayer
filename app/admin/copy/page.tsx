import Link from "next/link"
import { ArrowLeft, Type } from "lucide-react"
import { redirect } from "next/navigation"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminNav } from "@/components/admin/admin-nav"
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
    <InnerPageLayout activePath="/admin" contentClassName="max-w-[691px]">
      <Link
        href="/admin/settings"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to settings
      </Link>
      <div className="mb-2 flex items-center gap-2">
        <Type className="h-6 w-6 text-primary" aria-hidden="true" />
        <h1 className="text-2xl font-semibold">Site copy</h1>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Edit public-facing text on the sidebar, footer, and About page.
      </p>

      <AdminNav permissions={ctx.permissions} isFoundingAdmin={ctx.isFoundingAdmin} active="copy" />

      <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
        <SiteCopySettings initialCopy={copy} />
      </section>
    </InnerPageLayout>
  )
}
