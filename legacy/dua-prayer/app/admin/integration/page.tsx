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
import { getAiModerationAdminView, type AiModerationAdminView } from "@/lib/ai-moderation"
import {
  DEFAULT_MODERATION_TIMEOUT_MS,
  DEFAULT_REASONING_EFFORT,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
  DEFAULT_REQUEST_TIMEOUT_MS,
} from "@/lib/ai-provider"
import { getChannelFormRegistry, getVolunteerFormRegistry } from "@/lib/site-settings-server"
import { DEFAULT_CHANNEL_REGISTRY, DEFAULT_VOLUNTEER_REGISTRY, type FormRegistry } from "@/lib/form-fields"
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
  "form-builder",
  "webhooks",
  "supabase",
  "auth",
  "api-keys",
  "ai-moderation",
]

function resolveInitialTab(tab: string | undefined): IntegrationTabId {
  if (tab === "volunteer-webhook") return "webhooks"
  if (tab === "fillout") return "form-builder"
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
  const canVolunteer = canManageSettings || hasPermission(ctx, "manage_volunteers")
  const canManageChannels = canManageSettings || hasPermission(ctx, "manage_channels")

  if (!canManageSettings && !canVolunteer && !canManageChannels) redirect(signInHref({ error: "not_admin" }))

  let stripeSettings = emptyStripeSettingsAdminView()
  let aiModerationSettings: AiModerationAdminView = {
    enabled: false,
    provider: "none",
    model: "gpt-4o-mini",
    hasApiKey: false,
    apiKeyLast4: null,
    ready: false,
    modelMode: "manual",
    moderationTimeoutMs: DEFAULT_MODERATION_TIMEOUT_MS,
    reasoningEffort: DEFAULT_REASONING_EFFORT,
    maxTokens: DEFAULT_MAX_TOKENS,
    temperature: DEFAULT_TEMPERATURE,
    requestTimeoutMs: DEFAULT_REQUEST_TIMEOUT_MS,
    autoModel: null,
  }
  let channelFormRegistry: FormRegistry = DEFAULT_CHANNEL_REGISTRY
  let volunteerFormRegistry: FormRegistry = DEFAULT_VOLUNTEER_REGISTRY
  const warnings: string[] = []

  try {
    const [loadedStripe, loadedAiModeration, loadedChannelRegistry, loadedVolunteerRegistry] = await Promise.all([
      canManageSettings ? getStripeSettingsForAdmin() : Promise.resolve(null),
      canManageSettings ? getAiModerationAdminView() : Promise.resolve(null),
      canManageChannels ? getChannelFormRegistry() : Promise.resolve(null),
      canVolunteer ? getVolunteerFormRegistry() : Promise.resolve(null),
    ])
    if (loadedStripe) stripeSettings = loadedStripe
    if (loadedAiModeration) aiModerationSettings = loadedAiModeration
    if (loadedChannelRegistry) channelFormRegistry = loadedChannelRegistry
    if (loadedVolunteerRegistry) volunteerFormRegistry = loadedVolunteerRegistry
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
          channelFormRegistry={channelFormRegistry}
          volunteerFormRegistry={volunteerFormRegistry}
          envStatus={envStatus}
          aiModerationSettings={aiModerationSettings}
          canManageStripe={canManageSettings}
          canManageVolunteer={canVolunteer}
          canManageChannels={canManageChannels}
        />
      </Suspense>
    </InnerPageLayout>
  )
}
