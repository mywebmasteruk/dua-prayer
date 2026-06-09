import Link from "next/link"
import { CreditCard, Type } from "lucide-react"
import { redirect } from "next/navigation"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminNav } from "@/components/admin/admin-nav"
import { SiteCopySettings } from "@/components/admin/site-copy-settings"
import { getSiteCopyForAdmin } from "@/app/actions/site-copy"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { signInHref } from "@/lib/auth-modal"
import { Button } from "@/components/ui/button"

export default async function AdminCopyPage() {
  const ctx = await getAdminContext()
  if (!ctx) redirect(signInHref({ next: "/admin/copy" }))
  if (!hasPermission(ctx, "manage_settings")) redirect(signInHref({ error: "not_admin" }))

  const copy = await getSiteCopyForAdmin()

  return (
    <InnerPageLayout activePath="/admin" contentClassName="max-w-[691px]">
      <div className="mb-2 flex items-center gap-2">
        <Type className="h-6 w-6 text-primary" aria-hidden="true" />
        <h1 className="text-2xl font-semibold">Site copy</h1>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Edit public-facing text on the sidebar, footer, and About page.
      </p>

      <AdminNav permissions={ctx.permissions} isFoundingAdmin={ctx.isFoundingAdmin} active="copy" />

      <section className="mb-6 rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Stripe donations</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect Stripe API keys to enable secure checkout on{" "}
              <Link href="/donate" className="text-primary underline-offset-2 hover:underline">
                /donate
              </Link>
              .
            </p>
          </div>
          <Button variant="outline" size="sm" asChild className="rounded-full">
            <Link href="/admin/settings/stripe">
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              Stripe settings
            </Link>
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
        <SiteCopySettings initialCopy={copy} />
      </section>
    </InnerPageLayout>
  )
}
