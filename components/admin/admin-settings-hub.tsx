"use client"

import { useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PostingAccessSettings } from "@/components/admin/posting-access-settings"
import { CustomCodeSettings } from "@/components/admin/custom-code-settings"
import { BetaBannerSettings } from "@/components/admin/beta-banner-settings"
import { VolunteerFormSettings } from "@/components/admin/volunteer-form-settings"
import { AdminSection } from "@/components/admin/admin-section"
import { cn } from "@/lib/utils"
import type { CustomCode } from "@/lib/custom-code-server"
import type { BetaBannerSettings as BetaBannerSettingsValue } from "@/lib/site-settings-server"
import { SETTINGS_TABS, resolveSettingsTab, type SettingsTabId } from "@/lib/admin-settings-tabs"
import type { PostingMode } from "@/lib/posting-settings-shared"

type SettingsHubProps = {
  initialTab: SettingsTabId
  postingMode: PostingMode
  betaBanner: BetaBannerSettingsValue | null
  volunteerFillout: string
  customCode: CustomCode
  canManageSettings: boolean
  canManageVolunteers: boolean
  isFoundingAdmin: boolean
}

function SettingsTabBar({ activeTab, onTabChange }: { activeTab: SettingsTabId; onTabChange: (tab: SettingsTabId) => void }) {
  return (
    <div
      className="flex overflow-x-auto border-b border-border/70 bg-background [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Settings sections"
    >
      {SETTINGS_TABS.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`settings-panel-${tab.id}`}
            id={`settings-tab-${tab.id}`}
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

export function AdminSettingsHub({
  initialTab,
  postingMode,
  betaBanner,
  volunteerFillout,
  customCode,
  canManageSettings,
  canManageVolunteers,
  isFoundingAdmin,
}: SettingsHubProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = resolveSettingsTab(searchParams?.get("tab"), initialTab)

  const handleTabChange = useCallback(
    (tab: SettingsTabId) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "")
      params.set("tab", tab)
      router.replace(`/admin/settings?${params.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  return (
    <div className="space-y-0">
      <SettingsTabBar activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="pt-6">
        {/* Posting & Access */}
        <div
          id="settings-panel-posting"
          role="tabpanel"
          aria-labelledby="settings-tab-posting"
          className={activeTab === "posting" ? undefined : "hidden"}
        >
          <PostingAccessSettings initialMode={postingMode} canManageSettings={canManageSettings} />
        </div>

        {/* Beta Banner */}
        <div
          id="settings-panel-banner"
          role="tabpanel"
          aria-labelledby="settings-tab-banner"
          className={activeTab === "banner" ? undefined : "hidden"}
        >
          {isFoundingAdmin && betaBanner ? (
            <BetaBannerSettings initialSettings={betaBanner} />
          ) : (
            <AdminSection title="Beta Banner" description="Control the announcement banner shown at the top of every page.">
              <p className="text-sm text-muted-foreground">Beta banner settings are restricted to the founding admin.</p>
            </AdminSection>
          )}
        </div>

        {/* Forms */}
        <div
          id="settings-panel-forms"
          role="tabpanel"
          aria-labelledby="settings-tab-forms"
          className={activeTab === "forms" ? undefined : "hidden"}
        >
          {canManageSettings || canManageVolunteers ? (
            <VolunteerFormSettings initialValue={volunteerFillout} />
          ) : (
            <AdminSection title="Forms" description="Configure embedded Fillout forms for volunteer applications.">
              <p className="text-sm text-muted-foreground">You do not have permission to manage form settings.</p>
            </AdminSection>
          )}
        </div>

        {/* Custom Code */}
        <div
          id="settings-panel-custom-code"
          role="tabpanel"
          aria-labelledby="settings-tab-custom-code"
          className={activeTab === "custom-code" ? undefined : "hidden"}
        >
          {canManageSettings ? (
            <CustomCodeSettings initialCode={customCode} />
          ) : (
            <AdminSection title="Custom Code" description="Inject scripts into the page header and footer.">
              <p className="text-sm text-muted-foreground">Settings access required.</p>
            </AdminSection>
          )}
        </div>
      </div>
    </div>
  )
}
