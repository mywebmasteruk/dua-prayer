import { Suspense } from "react"
import { redirect } from "next/navigation"
import { Plug } from "lucide-react"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { IntegrationHub } from "@/components/admin/integration-hub"
import { isIntegrationTabId } from "@/components/admin/admin-integration-tab-bar"
import { getStripeSettingsForAdmin } from "@/lib/stripe-settings-server"
import { getVolunteerFilloutSettingForAdmin } from "@/app/actions/settings"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { signInHref } from "@/lib/auth-modal"
import { getIntegrationEnvStatus } from "@/lib/integration-env-status"

type PageProps = {
  searchParams: Promise<{ tab?: string }>
}

export default async function AdminIntegrationPage({ searchParams }: PageProps) {
  const ctx = await getAdminContext()

  if (!ctx) redirect(signInHref({ next: "/admin/integration" }))

  const canManageSettings = ctx.isFoundingAdmin || hasPermission(ctx, "manage_settings")
  const canVolunteer =
    hasPermission(ctx, "manage_settings") || hasPermission(ctx, "manage_volunteers")

  if (!canManageSettings && !canVolunteer) redirect(signInHref({ error: "not_admin" }))

  const params = await searchParams
  const initialTab = isIntegrationTabId(params.tab) ? params.tab : "stripe"

  const [stripeSettings, filloutValue] = await Promise.all([
    canManageSettings ? getStripeSettingsForAdmin() : Promise.resolve(null),
    canVolunteer ? getVolunteerFilloutSettingForAdmin() : Promise.resolve(""),
  ])

  const envStatus = getIntegrationEnvStatus()

  return (
    <InnerPageLayout activePath="/admin/integration">
      <AdminPageHeader
        icon={Plug}
        title="Integration"
        description="Connect payments, forms, webhooks, and platform services used by DuaPrayer."
      />

      <Suspense fallback={<div className="py-8 text-sm text-muted-foreground">Loading integrations…</div>}>
        <IntegrationHub
          initialTab={initialTab}
          stripeSettings={
            stripeSettings ?? {
              mode: "live",
              live: {
                hasSecretKey: false,
                secretKeyLast4: null,
                secretKeySource: null,
                publishableKey: "",
                publishableKeySource: null,
                hasWebhookSecret: false,
                webhookSecretLast4: null,
                webhookSecretSource: null,
                donationProductId: "",
                donationProductIdSource: null,
                ready: false,
              },
              test: {
                hasSecretKey: false,
                secretKeyLast4: null,
                secretKeySource: null,
                publishableKey: "",
                publishableKeySource: null,
                hasWebhookSecret: false,
                webhookSecretLast4: null,
                webhookSecretSource: null,
                donationProductId: "",
                donationProductIdSource: null,
                ready: false,
              },
              donationsReady: false,
              activeModeReady: false,
            }
          }
          filloutValue={filloutValue}
          envStatus={envStatus}
          canManageStripe={canManageSettings}
          canManageFillout={canVolunteer}
        />
      </Suspense>
    </InnerPageLayout>
  )
}
