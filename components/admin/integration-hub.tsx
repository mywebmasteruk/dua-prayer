"use client"

import { useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AdminIntegrationTabBar, type IntegrationTabId } from "@/components/admin/admin-integration-tab-bar"
import { resolveIntegrationTabId } from "@/lib/integration-tabs"
import { IntegrationAuthTab } from "@/components/admin/integration-auth-tab"
import { IntegrationFilloutTab } from "@/components/admin/integration-fillout-tab"
import { IntegrationStripeTab } from "@/components/admin/integration-stripe-tab"
import { IntegrationSupabaseTab } from "@/components/admin/integration-supabase-tab"
import { IntegrationWebhooksTab } from "@/components/admin/integration-webhooks-tab"
import { IntegrationApiKeysMcpTab } from "@/components/admin/integration-api-keys-mcp-tab"
import type { StripeSettingsAdminView } from "@/lib/stripe-settings-server"
import type { IntegrationEnvStatus } from "@/lib/integration-env-status"

type IntegrationHubProps = {
  initialTab: IntegrationTabId
  stripeSettings: StripeSettingsAdminView
  filloutValue: string
  envStatus: IntegrationEnvStatus
  canManageStripe: boolean
  canManageFillout: boolean
}

export function IntegrationHub({
  initialTab,
  stripeSettings,
  filloutValue,
  envStatus,
  canManageStripe,
  canManageFillout,
}: IntegrationHubProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams?.get("tab") ?? undefined
  const activeTab: IntegrationTabId = resolveIntegrationTabId(tabParam) ?? initialTab

  const handleTabChange = useCallback(
    (tab: IntegrationTabId) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "")
      params.set("tab", tab)
      router.replace(`/admin/integration?${params.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  return (
    <div className="space-y-0">
      <AdminIntegrationTabBar activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="pt-6">
        {activeTab === "stripe" && canManageStripe ? (
          <IntegrationStripeTab initial={stripeSettings} />
        ) : null}
        {activeTab === "stripe" && !canManageStripe ? (
          <p className="text-sm text-muted-foreground">You don&apos;t have permission to manage Stripe settings.</p>
        ) : null}
        {activeTab === "fillout" && canManageFillout ? (
          <IntegrationFilloutTab initialValue={filloutValue} />
        ) : null}
        {activeTab === "fillout" && !canManageFillout ? (
          <p className="text-sm text-muted-foreground">You don&apos;t have permission to manage Fillout settings.</p>
        ) : null}
        {activeTab === "webhooks" ? (
          <IntegrationWebhooksTab
            appUrl={envStatus.appUrl}
            volunteerWebhookConfigured={envStatus.volunteerWebhookConfigured}
            channelWebhookConfigured={envStatus.channelWebhookConfigured}
            stripeSettings={stripeSettings}
          />
        ) : null}
        {activeTab === "supabase" ? <IntegrationSupabaseTab status={envStatus.supabase} /> : null}
        {activeTab === "auth" ? (
          <IntegrationAuthTab status={envStatus.auth} appUrl={envStatus.appUrl} />
        ) : null}
        {activeTab === "api-keys" ? (
          <IntegrationApiKeysMcpTab
            envStatus={envStatus}
            stripeSettings={stripeSettings}
            filloutConfigured={Boolean(filloutValue.trim())}
          />
        ) : null}
      </div>
    </div>
  )
}
