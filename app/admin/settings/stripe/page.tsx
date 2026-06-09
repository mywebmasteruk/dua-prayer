import Link from "next/link"
import { redirect } from "next/navigation"
import { CreditCard } from "lucide-react"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminNav } from "@/components/admin/admin-nav"
import { StripeSettingsForm } from "@/components/admin/stripe-settings"
import { getStripeSettingsAdminView } from "@/app/actions/stripe-settings"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { signInHref } from "@/lib/auth-modal"

export default async function AdminStripeSettingsPage() {
  const ctx = await getAdminContext()

  if (!ctx) redirect(signInHref({ next: "/admin/settings/stripe" }))

  const canManageStripe = ctx.isFoundingAdmin || hasPermission(ctx, "manage_settings")
  if (!canManageStripe) redirect(signInHref({ error: "not_admin" }))

  const stripeSettings = await getStripeSettingsAdminView()
  if (!stripeSettings) redirect(signInHref({ error: "not_admin" }))

  return (
    <InnerPageLayout activePath="/admin" contentClassName="max-w-[691px]">
      <div className="mb-2 flex items-center gap-2">
        <CreditCard className="h-6 w-6 text-primary" aria-hidden="true" />
        <h1 className="text-2xl font-semibold">Stripe donations</h1>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Connect the masjidweb.com Stripe account so visitors can give on{" "}
        <Link href="/donate" className="text-primary underline-offset-2 hover:underline">
          /donate
        </Link>
        .
      </p>

      <AdminNav permissions={ctx.permissions} isFoundingAdmin={ctx.isFoundingAdmin} active="settings" />

      <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">API keys &amp; product</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {stripeSettings.donationsReady
            ? "Donations are configured. Update keys below if you rotate them in Stripe."
            : "Add your secret key to enable checkout. Publishable key and webhook secret are optional."}
        </p>
        <div className="mt-6">
          <StripeSettingsForm initial={stripeSettings} />
        </div>
      </section>
    </InnerPageLayout>
  )
}
