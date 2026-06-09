"use client"

import { cn } from "@/lib/utils"

export type IntegrationTabId =
  | "stripe"
  | "fillout"
  | "volunteer-webhook"
  | "supabase"
  | "auth"

export const INTEGRATION_TABS: { id: IntegrationTabId; label: string }[] = [
  { id: "stripe", label: "Stripe" },
  { id: "fillout", label: "Fillout" },
  { id: "volunteer-webhook", label: "Volunteer webhook" },
  { id: "supabase", label: "Supabase" },
  { id: "auth", label: "Email & Auth" },
]

export function isIntegrationTabId(value: string | undefined): value is IntegrationTabId {
  return INTEGRATION_TABS.some((tab) => tab.id === value)
}

type AdminIntegrationTabBarProps = {
  activeTab: IntegrationTabId
  onTabChange: (tab: IntegrationTabId) => void
}

export function AdminIntegrationTabBar({ activeTab, onTabChange }: AdminIntegrationTabBarProps) {
  return (
    <div
      className="flex overflow-x-auto border-b border-border/70 bg-background [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Integrations"
    >
      {INTEGRATION_TABS.map((tab) => {
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`integration-panel-${tab.id}`}
            id={`integration-tab-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative shrink-0 px-4 py-3 text-sm transition hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:px-5 sm:text-[15px]",
              isActive ? "font-semibold text-foreground" : "font-normal text-muted-foreground",
            )}
          >
            {tab.label}
            {isActive ? (
              <span
                className="absolute bottom-0 left-1/2 h-0.5 w-[calc(100%-1rem)] max-w-24 -translate-x-1/2 rounded-full bg-primary"
                aria-hidden="true"
              />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
