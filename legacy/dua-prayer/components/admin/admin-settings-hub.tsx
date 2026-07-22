"use client"

import { useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PostingAccessSettings } from "@/components/admin/posting-access-settings"
import { CustomCodeSettings } from "@/components/admin/custom-code-settings"
import { SeoSettingsForm } from "@/components/admin/seo-settings"
import { PageSeoSettingsForm } from "@/components/admin/page-seo-settings"
import { RssSettingsForm } from "@/components/admin/rss-settings"
import { FooterLinksSettings } from "@/components/admin/footer-links-settings"
import { AdminSection } from "@/components/admin/admin-section"
import { cn } from "@/lib/utils"
import type { CustomCode } from "@/lib/custom-code-server"
import type { SeoSettings } from "@/lib/seo-settings-server"
import type { PageSeoOverrides, PageSeoSlug } from "@/lib/page-seo-server"
import type { RssSettings } from "@/lib/rss-settings-server"
import type { FooterLink } from "@/lib/footer-links-server"
import { SETTINGS_TABS, resolveSettingsTab, type SettingsTabId } from "@/lib/admin-settings-tabs"
import type { PostingMode } from "@/lib/posting-settings-shared"

type SettingsHubProps = {
  initialTab: SettingsTabId
  postingMode: PostingMode
  customCode: CustomCode
  seoSettings: SeoSettings
  pageSeo: Record<PageSeoSlug, PageSeoOverrides>
  rssSettings: RssSettings
  rssFeedUrl: string
  rssChannels: ReadonlyArray<{ id: string; name: string }>
  footerLinks: FooterLink[]
  footerLinkDefaults: ReadonlyArray<FooterLink>
  canManageSettings: boolean
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
  customCode,
  seoSettings,
  pageSeo,
  rssSettings,
  rssFeedUrl,
  rssChannels,
  footerLinks,
  footerLinkDefaults,
  canManageSettings,
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

        {/* SEO & Social */}
        <div
          id="settings-panel-seo"
          role="tabpanel"
          aria-labelledby="settings-tab-seo"
          className={activeTab === "seo" ? undefined : "hidden"}
        >
          {canManageSettings ? (
            <SeoSettingsForm initialSettings={seoSettings} />
          ) : (
            <AdminSection title="SEO & Social Sharing" description="Search and link-preview metadata.">
              <p className="text-sm text-muted-foreground">Settings access required.</p>
            </AdminSection>
          )}
        </div>

        {/* Per-page SEO */}
        <div
          id="settings-panel-page-seo"
          role="tabpanel"
          aria-labelledby="settings-tab-page-seo"
          className={activeTab === "page-seo" ? undefined : "hidden"}
        >
          {canManageSettings ? (
            <PageSeoSettingsForm initialOverrides={pageSeo} />
          ) : (
            <AdminSection title="Per-page SEO" description="Override title, description, and share image per page.">
              <p className="text-sm text-muted-foreground">Settings access required.</p>
            </AdminSection>
          )}
        </div>

        {/* RSS Feed */}
        <div
          id="settings-panel-rss"
          role="tabpanel"
          aria-labelledby="settings-tab-rss"
          className={activeTab === "rss" ? undefined : "hidden"}
        >
          {canManageSettings ? (
            <RssSettingsForm
              initialSettings={rssSettings}
              channels={[...rssChannels]}
              feedUrl={rssFeedUrl}
            />
          ) : (
            <AdminSection title="RSS Feed" description="Publish recent duas as an RSS 2.0 feed.">
              <p className="text-sm text-muted-foreground">Settings access required.</p>
            </AdminSection>
          )}
        </div>

        {/* Footer Links */}
        <div
          id="settings-panel-footer-links"
          role="tabpanel"
          aria-labelledby="settings-tab-footer-links"
          className={activeTab === "footer-links" ? undefined : "hidden"}
        >
          {canManageSettings ? (
            <FooterLinksSettings initialLinks={footerLinks} defaults={footerLinkDefaults} />
          ) : (
            <AdminSection title="Footer Links" description="Add, edit, and reorder the links shown in the site footer.">
              <p className="text-sm text-muted-foreground">Settings access required.</p>
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
