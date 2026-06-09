import { Suspense } from "react"
import { redirect } from "next/navigation"
import { Plug } from "lucide-react"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { IntegrationHub } from "@/components/admin/integration-hub"
import { isIntegrationTabId } from "@/components/admin/admin-integration-tab-bar"
import {
  emptyStripeSettingsAdminView,
  getStripeSettingsForAdmin,
} from "@/lib/stripe-settings-server"
import { getVolunteerFilloutSettingValue } from "@/lib/site-settings-server"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { signInHref } from "@/lib/auth-modal"
import { getIntegrationEnvStatus } from "@/lib/integration-env-status"

type PageProps = {
  searchParams: Promise<{ tab?: string }>
}

function IntegrationLoadError({ message }: { message: string }) {
  return (
    <InnerPageLayout activePath="/admin/integration">
      <AdminPageHeader
        icon={Plug}
        title="Integration"
        description="Connect payments, forms, webhooks, and platform services used by DuaPrayer."
      />
      <div
        role="alert"
        className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-4 text-sm text-destructive"
      >
        <p className="font-semibold">Could not load Integration</p>
        <p className="mt-1 text-destructive/90">{message}</p>
      </div>
    </InnerPageLayout>
  )
}

export default async function AdminIntegrationPage({ searchParams }: PageProps) {
  try {
    const ctx = await getAdminContext()

    if (!ctx) redirect(signInHref({ next: "/admin/integration" }))

    const canManageSettings = ctx.isFoundingAdmin || hasPermission(ctx, "manage_settings")
    const canVolunteer =
      hasPermission(ctx, "manage_settings") || hasPermission(ctx, "manage_volunteers")

    if (!canManageSettings && !canVolunteer) redirect(signInHref({ error: "not_admin" }))

    const params = await searchParams
    const initialTab = isIntegrationTabId(params.tab) ? params.tab : "stripe"

    let stripeSettings = emptyStripeSettingsAdminView()
    let filloutValue = ""
    let loadWarning: string | null = null

    try {
      const [loadedStripe, loadedFillout] = await Promise.all([
        canManageSettings ? getStripeSettingsForAdmin() : Promise.resolve(null),
        canVolunteer ? getVolunteerFilloutSettingValue() : Promise.resolve(""),
      ])
      if (loadedStripe) stripeSettings = loadedStripe
      filloutValue = loadedFillout
    } catch (error) {
      console.error("Admin integration page failed to load settings:", error)
      loadWarning =
        "Some integration settings could not be loaded. You can still review tabs below."
    }

    const envStatus = getIntegrationEnvStatus()

    return (
      <InnerPageLayout activePath="/admin/integration">
        <AdminPageHeader
          icon={Plug}
          title="Integration"
          description="Connect payments, forms, webhooks, and platform services used by DuaPrayer."
        />

        {loadWarning ? (
          <p className="mb-4 rounded-lg border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {loadWarning}
          </p>
        ) : null}

        <Suspense
          fallback={
            <div className="py-8 text-sm text-muted-foreground">Loading integrations…</div>
          }
        >
          <IntegrationHub
            initialTab={initialTab}
            stripeSettings={stripeSettings}
            filloutValue={filloutValue}
            envStatus={envStatus}
            canManageStripe={canManageSettings}
            canManageFillout={canVolunteer}
          />
        </Suspense>
      </InnerPageLayout>
    )
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error
    }
    console.error("Admin integration page render failed:", error)
    return (
      <IntegrationLoadError message="Something went wrong loading this page. Try refreshing, or check Supabase and deployment environment variables." />
    )
  }
}
