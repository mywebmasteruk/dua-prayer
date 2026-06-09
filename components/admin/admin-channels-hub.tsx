"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { AdminChannelApplicationsList } from "@/components/admin/admin-channel-applications-list"
import { AdminChannelsSettings } from "@/components/admin/admin-channels-settings"
import type { AdminChannelRecord } from "@/app/actions/admin-channels"
import type { ChannelApplicationRecord } from "@/app/actions/channel-applications"

export type AdminChannelsTabId = "applications" | "approved"

const TABS: Array<{ id: AdminChannelsTabId; label: string }> = [
  { id: "applications", label: "Applications" },
  { id: "approved", label: "Approved channels" },
]

type AdminChannelsHubProps = {
  initialApplications: ChannelApplicationRecord[]
  initialChannels: AdminChannelRecord[]
}

export function AdminChannelsHub({ initialApplications, initialChannels }: AdminChannelsHubProps) {
  const [activeTab, setActiveTab] = useState<AdminChannelsTabId>("applications")

  return (
    <div className="space-y-6">
      <div
        className="flex overflow-x-auto border-b border-border/70 bg-background [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Channel administration"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
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

      {activeTab === "applications" ? (
        <AdminChannelApplicationsList initialApplications={initialApplications} initialFilter="pending_review" />
      ) : (
        <AdminChannelsSettings initialChannels={initialChannels} />
      )}
    </div>
  )
}
