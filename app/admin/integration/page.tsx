import { Suspense } from "react"
import { redirect } from "next/navigation"
import { Plug } from "lucide-react"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { IntegrationHub } from "@/components/admin/integration-hub"
import type { IntegrationTabId } from "@/components/admin/admin-integration-tab-bar"
import {
  emptyStripeSettingsAdminView,
  getStripeSettingsForAdmin,
} from "@/lib/stripe-settings-server"
import { getVolunteerFilloutSettingValue } from "@/lib/site-settings-server"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { signInHref } from "@/lib/auth-modal"
import {
  emptyIntegrationEnvStatus,
  getIntegrationEnvStatus,
} from "@/lib/integration-env-status"

type PageProps = {
  searchParams: Promise<{ tab?: string }>
}

const INTEGRATION_TAB_IDS: IntegrationTabId[] = [
  "stripe",
  "fillout",
  "webhooks",
  "supabase",
  "auth",
  "api-keys",
]

function resolveInitialTab(tab: string | undefined): IntegrationTabId {
  if (tab === "volunteer-webhook") return "webhooks"
  if (tab && INTEGRATION_TAB_IDS.includes(tab as IntegrationTabId)) {
    return tab as IntegrationTabId
  }
  return "stripe"
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

function shouldShowDebugDetail(isFoundingAdmin: boolean): boolean {
  return process.env.NODE_ENV !== "production" || isFoundingAdmin
}

export default async function AdminIntegrationPage({ searchParams }: PageProps) {
  const params = await searchParams
  const initialTab = resolveInitialTab(params.tab)

  let ctx: Awaited<ReturnType<typeof getAdminContext>> = null
  try {
    ctx = await getAdminContext()
  } catch (error) {
    console.error("Admin integration: getAdminContext failed:", error)
    redirect(signInHref({ next: "/admin/integration" }))
  }

  if (!ctx) redirect(signInHref({ next: "/admin/integration" }))

  const canManageSettings = ctx.isFoundingAdmin || hasPermission(ctx, "manage_settings")
  const canVolunteer =
    hasPermission(ctx, "manage_settings") || hasPermission(ctx, "manage_volunteers")

  if (!canManageSettings && !canVolunteer) redirect(signInHref({ error: "not_admin" }))

  let stripeSettings = emptyStripeSettingsAdminView()
  let filloutValue = ""
  const warnings: string[] = []

  try {
    const [loadedStripe, loadedFillout] = await Promise.all([
      canManageSettings ? getStripeSettingsForAdmin() : Promise.resolve(null),
      canVolunteer ? getVolunteerFilloutSettingValue() : Promise.resolve(""),
    ])
    if (loadedStripe) stripeSettings = loadedStripe
    filloutValue = loadedFillout
  } catch (error) {
    console.error("Admin integration page failed to load settings:", error)
    warnings.push(
      "Some integration settings could not be loaded. You can still review tabs below.",
    )
    if (shouldShowDebugDetail(ctx.isFoundingAdmin)) {
      warnings.push(errorMessage(error))
    }
  }

  let envStatus = emptyIntegrationEnvStatus()
  try {
    envStatus = getIntegrationEnvStatus()
  } catch (error) {
    console.error("Admin integration page failed to read env status:", error)
    warnings.push("Environment status could not be read. Supabase and auth tabs may be incomplete.")
    if (shouldShowDebugDetail(ctx.isFoundingAdmin)) {
      warnings.push(errorMessage(error))
    }
  }

  return (
    <InnerPageLayout activePath="/admin/integration">
      <AdminPageHeader
        icon={Plug}
        title="Integration"
        description="Connect payments, forms, webhooks, and platform services used by DuaPrayer."
      />

      {warnings.length > 0 ? (
        <div className="mb-4 space-y-2">
          {warnings.map((warning) => (
            <p
              key={warning}
              className="rounded-lg border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            >
              {warning}
            </p>
          ))}
        </div>
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
}
