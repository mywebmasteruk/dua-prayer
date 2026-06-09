"use client"

import { useCallback, useState } from "react"
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
}

export function IntegrationHub({
  initialTab,
  stripeSettings,
  filloutValue,
  envStatus,
}: IntegrationHubProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<IntegrationTabId>(initialTab)

  const handleTabChange = useCallback(
    (tab: IntegrationTabId) => {
      setActiveTab(tab)
      const params = new URLSearchParams(searchParams?.toString() ?? "")
      params.set("tab", tab)
      router.replace(`/admin/integration?${params.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  const tabFromUrl = searchParams?.get("tab")
  const resolvedTab = isIntegrationTabId(tabFromUrl ?? undefined) ? tabFromUrl : activeTab

  return (
    <div className="space-y-0">
      <AdminIntegrationTabBar activeTab={resolvedTab} onTabChange={handleTabChange} />

      <div className="pt-6">
        {resolvedTab === "stripe" ? (
          <IntegrationStripeTab initial={stripeSettings} />
        ) : null}
        {resolvedTab === "fillout" ? <IntegrationFilloutTab initialValue={filloutValue} /> : null}
        {resolvedTab === "volunteer-webhook" ? (
          <IntegrationVolunteerWebhookTab appUrl={envStatus.appUrl} webhookConfigured={envStatus.volunteerWebhookConfigured} />
        ) : null}
        {resolvedTab === "supabase" ? <IntegrationSupabaseTab status={envStatus.supabase} /> : null}
        {resolvedTab === "auth" ? <IntegrationAuthTab status={envStatus.auth} appUrl={envStatus.appUrl} /> : null}
      </div>
    </div>
  )
}
