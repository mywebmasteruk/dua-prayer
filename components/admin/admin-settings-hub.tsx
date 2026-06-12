"use client"

import Link from "next/link"
import { useCallback, type ReactNode } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronRight, FileText, KeyRound, Plug, Shield, SlidersHorizontal, Type, type LucideIcon } from "lucide-react"
import { AdminSection } from "@/components/admin/admin-section"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { PostingAccessSettings } from "@/components/admin/posting-access-settings"
import { CustomCodeSettings } from "@/components/admin/custom-code-settings"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getPostingModeOption, type PostingMode } from "@/lib/posting-settings-shared"
import type { AiProviderAdminView } from "@/lib/ai-provider"
import type { BotRuntimeStatus, DuaEventBot } from "@/lib/dua-bots"
import type { CustomCode } from "@/lib/custom-code-server"
import { SETTINGS_TABS, resolveSettingsTab, type SettingsTabId } from "@/lib/admin-settings-tabs"

type SettingsHubProps = {
  initialTab: SettingsTabId
  postingMode: PostingMode
  aiProvider: AiProviderAdminView | null
  bots: DuaEventBot[]
  botRuntimeStatus: BotRuntimeStatus | null
  customCode: CustomCode
  canManageSettings: boolean
  canManageBots: boolean
  canManageAdmins: boolean
  canManageVolunteers: boolean
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

function SettingsLinkCard({
  title,
  description,
  href,
  icon: Icon,
  label = "Open",
  status,
}: {
  title: string
  description: string
  href: string
  icon: LucideIcon
  label?: string
  status?: ReactNode
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-background p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-foreground">{title}</h3>
              {status}
            </div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild className="shrink-0 rounded-full">
          <Link href={href}>
            {label}
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

export function AdminSettingsHub({
  initialTab,
  postingMode,
  aiProvider,
  bots,
  botRuntimeStatus,
  customCode,
  canManageSettings,
  canManageBots,
  canManageAdmins,
  canManageVolunteers,
}: SettingsHubProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = resolveSettingsTab(searchParams?.get("tab"), initialTab)
  const postingOption = getPostingModeOption(postingMode)
  const activeBots = bots.filter((bot) => bot.status === "active").length

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
        <div
          id="settings-panel-general"
          role="tabpanel"
          aria-labelledby="settings-tab-general"
          hidden={activeTab !== "general"}
          className={activeTab === "general" ? "space-y-4" : "hidden"}
        >
          <AdminSection
            title="General / Site Content"
            description="Central links for copy, homepage content, channels, beta messaging, and other visible site surfaces."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {canManageSettings ? (
                <SettingsLinkCard
                  title="Site Content"
                  description="Edit homepage, composer, channels, donate, auth, sidebar, footer, and About page text."
                  href="/admin/copy"
                  icon={Type}
                  label="Edit content"
                />
              ) : null}
              {canManageSettings ? (
                <SettingsLinkCard
                  title="Channels"
                  description="Create, sort, verify, and archive public dua categories and member channels."
                  href="/admin/channels"
                  icon={FileText}
                  label="Manage channels"
                />
              ) : null}
            </div>
          </AdminSection>
        </div>

        <div
          id="settings-panel-posting"
          role="tabpanel"
          aria-labelledby="settings-tab-posting"
          hidden={activeTab !== "posting"}
          className={activeTab === "posting" ? undefined : "hidden"}
        >
          <PostingAccessSettings initialMode={postingMode} canManageSettings={canManageSettings} />
        </div>

        <div
          id="settings-panel-ai-provider"
          role="tabpanel"
          aria-labelledby="settings-tab-ai-provider"
          hidden={activeTab !== "ai-provider"}
          className={activeTab === "ai-provider" ? undefined : "hidden"}
        >
          <AdminSection
            title="AI Provider"
            description="Provider settings are shared by dua moderation and event-aware bots."
            action={
              <Button variant="outline" size="sm" asChild className="rounded-full">
                <Link href="/admin/integration?tab=ai-moderation">
                  Configure provider
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            }
          >
            <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
              <div className="rounded-lg border border-border/60 p-3">
                <p className="font-medium text-foreground">Status</p>
                <div className="mt-2">
                  <AdminStatusBadge
                    label={aiProvider?.ready ? "Ready" : "Needs setup"}
                    tone={aiProvider?.ready ? "success" : "warning"}
                  />
                </div>
              </div>
              <div className="rounded-lg border border-border/60 p-3">
                <p className="font-medium text-foreground">Provider</p>
                <p className="mt-1">{aiProvider?.provider && aiProvider.provider !== "none" ? aiProvider.provider : "Not configured"}</p>
              </div>
              <div className="rounded-lg border border-border/60 p-3">
                <p className="font-medium text-foreground">API key</p>
                <p className="mt-1">{aiProvider?.hasApiKey ? `Saved ·•••• ${aiProvider.apiKeyLast4}` : "Not saved"}</p>
              </div>
            </div>
          </AdminSection>
        </div>

        <div
          id="settings-panel-ai-bots"
          role="tabpanel"
          aria-labelledby="settings-tab-ai-bots"
          hidden={activeTab !== "ai-bots"}
          className={activeTab === "ai-bots" ? undefined : "hidden"}
        >
          <AdminSection
            title="AI Bots"
            description="Create, edit, pause, resume, schedule, and run event-aware dua bots."
            action={
              canManageBots ? (
                <Button variant="outline" size="sm" asChild className="rounded-full">
                  <Link href="/admin/bots">
                    Open bot controls
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              ) : null
            }
          >
            <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
              <div className="rounded-lg border border-border/60 p-3">
                <p className="font-medium text-foreground">Configured bots</p>
                <p className="mt-1">{bots.length} total · {activeBots} active</p>
              </div>
              <div className="rounded-lg border border-border/60 p-3">
                <p className="font-medium text-foreground">Runtime</p>
                <div className="mt-2">
                  <AdminStatusBadge
                    label={botRuntimeStatus?.canGenerateDuas ? "Ready" : "Needs AI Provider"}
                    tone={botRuntimeStatus?.canGenerateDuas ? "success" : "warning"}
                  />
                </div>
              </div>
              <div className="rounded-lg border border-border/60 p-3">
                <p className="font-medium text-foreground">Cron endpoint</p>
                <p className="mt-1 font-mono text-xs">/api/bots/run</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {botRuntimeStatus?.helperText ?? "Bot controls require dua management access."}
            </p>
          </AdminSection>
        </div>

        <div
          id="settings-panel-integrations"
          role="tabpanel"
          aria-labelledby="settings-tab-integrations"
          hidden={activeTab !== "integrations"}
          className={activeTab === "integrations" ? undefined : "hidden"}
        >
          <AdminSection
            title="Integrations / Webhooks / API Keys"
            description="Connect payments, Fillout forms, Supabase, auth, webhooks, API keys, MCP, and AI Provider settings."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {(canManageSettings || canManageVolunteers) ? (
                <SettingsLinkCard
                  title="Integration hub"
                  description="Review Stripe, Fillout, webhooks, Supabase, auth, API keys, MCP, and AI Provider configuration."
                  href="/admin/integration"
                  icon={Plug}
                  label="Open integration"
                />
              ) : null}
              {canManageSettings ? (
                <SettingsLinkCard
                  title="API keys & MCP"
                  description="Check environment-backed service keys and MCP integration guidance without exposing secrets."
                  href="/admin/integration?tab=api-keys"
                  icon={KeyRound}
                  label="Review keys"
                />
              ) : null}
            </div>
          </AdminSection>
        </div>

        <div
          id="settings-panel-roles"
          role="tabpanel"
          aria-labelledby="settings-tab-roles"
          hidden={activeTab !== "roles"}
          className={activeTab === "roles" ? undefined : "hidden"}
        >
          <AdminSection
            title="Roles & Permissions"
            description="Invite admins, assign role presets, and review access to admin capabilities."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {canManageAdmins ? (
                <SettingsLinkCard
                  title="Admin roles"
                  description="Manage admin access, role presets, and the current admin team."
                  href="/admin/users/roles"
                  icon={Shield}
                  label="Manage roles"
                />
              ) : null}
              <SettingsLinkCard
                title="Current posting policy"
                description={postingOption?.helper ?? "Visitors and signed-in members can submit public duas."}
                href="/admin/settings?tab=posting"
                icon={SlidersHorizontal}
                label={postingOption?.label ?? "Anyone can post"}
                status={<AdminStatusBadge label={postingOption?.label ?? "Anyone can post"} tone={postingMode === "closed" ? "danger" : postingMode === "registered_only" ? "warning" : "success"} />}
              />
            </div>
          </AdminSection>
        </div>

        <div
          id="settings-panel-custom-code"
          role="tabpanel"
          aria-labelledby="settings-tab-custom-code"
          hidden={activeTab !== "custom-code"}
          className={activeTab === "custom-code" ? undefined : "hidden"}
        >
          {canManageSettings ? (
            <CustomCodeSettings initialCode={customCode} />
          ) : (
            <AdminSection title="Custom Code" description="You do not have permission to manage custom code.">
              <p className="text-sm text-muted-foreground">Settings access required.</p>
            </AdminSection>
          )}
        </div>
      </div>
    </div>
  )
}
