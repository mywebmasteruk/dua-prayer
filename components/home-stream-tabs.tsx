"use client"

import { useState } from "react"
import type { Category, Dua } from "@/lib/types/dua"
import { HomeComposer } from "@/components/home-composer"
import { FeedSection } from "@/components/feed-section"
import { HomeFeedTabBar, type HomeStreamTab } from "@/components/home-feed-tab-bar"
import { ChannelList, type ChannelItem } from "@/components/channel-list"

interface HomeStreamTabsProps {
  categories: Category[]
  channels: ChannelItem[]
  turnstileSiteKey?: string
  duas: Dua[]
  topCategories: Category[]
  pageSize: number
}

export function HomeStreamTabs({
  categories,
  channels,
  turnstileSiteKey,
  duas,
  topCategories,
  pageSize,
}: HomeStreamTabsProps) {
  const [activeTab, setActiveTab] = useState<HomeStreamTab>("feed")

  return (
    <>
      <HomeFeedTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <div
        id="home-stream-panel-feed"
        role="tabpanel"
        aria-labelledby="home-stream-tab-feed"
        hidden={activeTab !== "feed"}
        className={activeTab === "feed" ? undefined : "hidden"}
      >
        <HomeComposer categories={categories} turnstileSiteKey={turnstileSiteKey} />
        <FeedSection duas={duas} categories={categories} topCategories={topCategories} pageSize={pageSize} />
      </div>

      <div
        id="home-stream-panel-channels"
        role="tabpanel"
        aria-labelledby="home-stream-tab-channels"
        hidden={activeTab !== "channels"}
        className={activeTab === "channels" ? undefined : "hidden"}
      >
        <ChannelList channels={channels} />
      </div>
    </>
  )
}
