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
      className="sticky top-0 z-20 flex bg-white/95 shadow-[0_1px_12px_rgba(15,23,42,0.035)] backdrop-blur"
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
              "relative flex flex-1 items-center justify-center px-4 text-[15px] transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset lg:text-[19px]",
              isActive ? "font-bold text-primary" : "font-medium text-muted-foreground/75",
            )}
          >
            {tab.label}
            {isActive ? (
              <span
                className="absolute bottom-0 left-1/2 h-0.5 w-16 -translate-x-1/2 rounded-full bg-primary"
                aria-hidden="true"
              />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
