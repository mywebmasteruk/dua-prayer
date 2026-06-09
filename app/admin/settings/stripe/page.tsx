import Link from "next/link"
import { redirect } from "next/navigation"
import { CreditCard } from "lucide-react"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminSection } from "@/components/admin/admin-section"
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
    <InnerPageLayout activePath="/admin/settings/stripe">
      <AdminPageHeader
        icon={CreditCard}
        title="Stripe donations"
        backHref="/admin/settings"
        description={
          <>
            Connect the masjidweb.com Stripe account so visitors can give on{" "}
            <Link href="/donate" className="text-primary underline-offset-2 hover:underline">
              /donate
            </Link>
            .
          </>
        }
      />

      <AdminSection
        title="API keys & product"
        description={
          stripeSettings.donationsReady
            ? "Donations are configured. Update keys below if you rotate them in Stripe."
            : "Add your secret key to enable checkout. Publishable key and webhook secret are optional."
        }
        contentClassName="pt-0"
      >
        <StripeSettingsForm initial={stripeSettings} />
      </AdminSection>
    </InnerPageLayout>
  )
}
