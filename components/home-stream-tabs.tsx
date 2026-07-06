"use client"

import { useCallback, useEffect, useState } from "react"
import type { TrendingHashtag } from "@/lib/hashtags"
import type { Category, Dua } from "@/lib/types/dua"
import { HomeComposer } from "@/components/home-composer"
import { FeedSection } from "@/components/feed-section"
import { HomeFeedTabBar, type HomeStreamTab } from "@/components/home-feed-tab-bar"
import { FollowingSection } from "@/components/following-section"
import type { ComposerCopy, HomeEmptyCopy } from "@/lib/site-copy"
import type { PostingMode } from "@/lib/posting-settings-shared"

interface HomeStreamTabsProps {
  categories: Category[]
  turnstileSiteKey?: string
  duas: Dua[]
  trendingHashtags: TrendingHashtag[]
  pageSize: number
  total: number
  emptyCopy: HomeEmptyCopy
  composerCopy: ComposerCopy
  postingMode: PostingMode
  isSignedIn: boolean
  isAdmin: boolean
  preferredLanguages?: string[]
}

export function HomeStreamTabs({
  categories,
  turnstileSiteKey,
  duas,
  trendingHashtags,
  pageSize,
  total,
  emptyCopy,
  composerCopy,
  postingMode,
  isSignedIn,
  isAdmin,
  preferredLanguages = [],
}: HomeStreamTabsProps) {
  const [activeTab, setActiveTab] = useState<HomeStreamTab>("feed")

  useEffect(() => {
    if (typeof window === "undefined") return

    const params = new URLSearchParams(window.location.search)

    if (params.get("tab") === "channels") {
      params.delete("tab")
      const query = params.toString()
      window.location.replace(query ? `/channels?${query}` : "/channels")
      return
    }

    if (params.get("tab") === "following") setActiveTab("following")
  }, [])

  const handleTabChange = useCallback((tab: HomeStreamTab) => {
    setActiveTab(tab)

    if (typeof window === "undefined") return

    const params = new URLSearchParams(window.location.search)
    if (tab === "following") {
      params.set("tab", "following")
    } else {
      params.delete("tab")
      // Reset the Following tab's position when leaving it; the feed's own
      // ?page= param is left untouched.
      params.delete("fpage")
    }

    const query = params.toString()
    const nextUrl = query ? `/?${query}` : "/"
    const currentUrl = `${window.location.pathname}${window.location.search}`

    if (currentUrl !== nextUrl) {
      window.history.replaceState(window.history.state, "", nextUrl)
    }
  }, [])

  return (
    <>
      <HomeFeedTabBar activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="min-h-[280px]">
        <div
          id="home-stream-panel-feed"
          role="tabpanel"
          aria-labelledby="home-stream-tab-feed"
          hidden={activeTab !== "feed"}
          className={activeTab === "feed" ? undefined : "hidden"}
        >
          <HomeComposer
            categories={categories}
            turnstileSiteKey={turnstileSiteKey}
            copy={composerCopy}
            postingMode={postingMode}
            isSignedIn={isSignedIn}
            isAdmin={isAdmin}
            bindToGlobalCompose
          />
          <FeedSection
            duas={duas}
            categories={categories}
            trendingHashtags={trendingHashtags}
            pageSize={pageSize}
            total={total}
            feedActive={activeTab === "feed"}
            emptyCopy={emptyCopy}
            preferredLanguages={preferredLanguages}
          />
        </div>

        <div
          id="home-stream-panel-following"
          role="tabpanel"
          aria-labelledby="home-stream-tab-following"
          hidden={activeTab !== "following"}
          className={activeTab === "following" ? undefined : "hidden"}
        >
          <FollowingSection
            duas={duas}
            categories={categories}
            pageSize={pageSize}
            total={total}
            followingActive={activeTab === "following"}
            emptyCopy={emptyCopy}
          />
        </div>
      </div>
    </>
  )
}
