"use client"

import { cn } from "@/lib/utils"

export type HomeStreamTab = "feed" | "following"

/** Matches sticky tab bar height for right-rail alignment. */
export const HOME_FEED_TAB_BAR_HEIGHT_PX = 53

interface HomeFeedTabBarProps {
  activeTab: HomeStreamTab
  onTabChange: (tab: HomeStreamTab) => void
}

const TABS: { id: HomeStreamTab; label: string }[] = [
  { id: "feed", label: "Feed" },
  { id: "following", label: "Following" },
]

export function HomeFeedTabBar({ activeTab, onTabChange }: HomeFeedTabBarProps) {
  return (
    <div
      className="sticky top-0 z-20 flex border-b border-border/70 bg-white"
      style={{ minHeight: HOME_FEED_TAB_BAR_HEIGHT_PX }}
      role="tablist"
      aria-label="Home stream"
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`home-stream-panel-${tab.id}`}
            id={`home-stream-tab-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative flex flex-1 items-center justify-center px-4 text-[15px] transition hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset lg:text-[20px]",
              isActive ? "font-bold text-foreground" : "font-normal text-muted-foreground",
            )}
          >
            {tab.label}
            {isActive ? (
              <span
                className="absolute bottom-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-primary"
                aria-hidden="true"
              />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
