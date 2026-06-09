"use client"

import { useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AdminIntegrationTabBar,
  isIntegrationTabId,
  type IntegrationTabId,
} from "@/components/admin/admin-integration-tab-bar"
import { IntegrationAuthTab } from "@/components/admin/integration-auth-tab"
import { IntegrationFilloutTab } from "@/components/admin/integration-fillout-tab"
import { IntegrationStripeTab } from "@/components/admin/integration-stripe-tab"
import { IntegrationSupabaseTab } from "@/components/admin/integration-supabase-tab"
import { IntegrationVolunteerWebhookTab } from "@/components/admin/integration-volunteer-webhook-tab"
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
  const tabParam = searchParams?.get("tab")
  const activeTab = isIntegrationTabId(tabParam ?? undefined) ? tabParam : initialTab

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
        {activeTab === "volunteer-webhook" ? (
          <IntegrationVolunteerWebhookTab
            appUrl={envStatus.appUrl}
            webhookConfigured={envStatus.volunteerWebhookConfigured}
          />
        ) : null}
        {activeTab === "supabase" ? <IntegrationSupabaseTab status={envStatus.supabase} /> : null}
        {activeTab === "auth" ? (
          <IntegrationAuthTab status={envStatus.auth} appUrl={envStatus.appUrl} />
        ) : null}
      </div>
    </div>
  )
}
