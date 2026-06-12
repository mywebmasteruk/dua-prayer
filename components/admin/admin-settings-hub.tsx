"use client"

import { useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PostingAccessSettings } from "@/components/admin/posting-access-settings"
import { CustomCodeSettings } from "@/components/admin/custom-code-settings"
import { BetaBannerSettings } from "@/components/admin/beta-banner-settings"
import { VolunteerFormSettings } from "@/components/admin/volunteer-form-settings"
import { AdminSection } from "@/components/admin/admin-section"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getPostingModeOption, type PostingMode } from "@/lib/posting-settings-shared"
import type { CustomCode } from "@/lib/custom-code-server"
import type { BetaBannerSettings as BetaBannerSettingsValue } from "@/lib/site-settings-server"
import { SETTINGS_TABS, resolveSettingsTab, type SettingsTabId } from "@/lib/admin-settings-tabs"
import Link from "next/link"
import { Shield, SlidersHorizontal } from "lucide-react"

type SettingsHubProps = {
  initialTab: SettingsTabId
  postingMode: PostingMode
  betaBanner: BetaBannerSettingsValue | null
  volunteerFillout: string
  customCode: CustomCode
  canManageSettings: boolean
  canManageAdmins: boolean
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
  canManageAdmins,
  canManageVolunteers,
  isFoundingAdmin,
}: SettingsHubProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = resolveSettingsTab(searchParams?.get("tab"), initialTab)
  const postingOption = getPostingModeOption(postingMode)

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

        {/* Roles & Permissions */}
        <div
          id="settings-panel-roles"
          role="tabpanel"
          aria-labelledby="settings-tab-roles"
          className={activeTab === "roles" ? undefined : "hidden"}
        >
          <AdminSection
            title="Roles & Permissions"
            description="Invite admins, assign role presets, and control who can submit duas."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {canManageAdmins ? (
                <div className="rounded-xl border border-border/70 bg-background p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-3">
                      <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
                        <Shield className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="font-semibold">Admin roles</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Manage admin access, role presets, and the current admin team.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild className="shrink-0 rounded-full">
                      <Link href="/admin/users/roles">Manage</Link>
                    </Button>
                  </div>
                </div>
              ) : null}
              <div className="rounded-xl border border-border/70 bg-background p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 gap-3">
                    <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
                      <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">Posting policy</h3>
                        <AdminStatusBadge
                          label={postingOption?.label ?? "Anyone can post"}
                          tone={postingMode === "closed" ? "danger" : postingMode === "registered_only" ? "warning" : "success"}
                        />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{postingOption?.helper ?? "Visitors and signed-in members can submit public duas."}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0 rounded-full" onClick={() => handleTabChange("posting")}>
                    Change
                  </Button>
                </div>
              </div>
            </div>
          </AdminSection>
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
