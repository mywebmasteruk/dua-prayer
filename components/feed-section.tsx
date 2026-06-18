"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { getFeedDuas } from "@/app/actions/duas"
import type { Category, Dua } from "@/lib/types/dua"
import { getChannelHandle } from "@/lib/channels"
import { detectLanguage } from "@/lib/detect-language"
import { DuaList } from "@/components/dua-list"
import { NewDuasBanner } from "@/components/new-duas-banner"
import { useHomeSearch } from "@/components/home-search-provider"
import { matchesHashtag, normalizeHashtag, type TrendingHashtag } from "@/lib/hashtags"
import { useNewDuasPoll } from "@/hooks/use-new-duas-poll"
import { useNavigationRouter } from "@/hooks/use-navigation-router"
import type { HomeEmptyCopy } from "@/lib/site-copy"

interface FeedSectionProps {
  duas: Dua[]
  categories: Category[]
  trendingHashtags: TrendingHashtag[]
  pageSize: number
  /** Total published duas on the server (the duas prop is only the first batch). */
  total: number
  feedActive?: boolean
  emptyCopy?: Pick<HomeEmptyCopy, "homeFeedEmptyTitle" | "homeFeedEmptyDescription">
  /**
   * Lock the feed to a single topic category or community channel
   * (used by /channels/[handle]). `field` selects which dua column to match:
   * "category_id" for topic pages, "channel_id" for community-channel pages.
   */
  lockTo?: { field: "category_id" | "channel_id"; id: number }
  /**
   * Language codes the signed-in user prefers (from saved preferences).
   * Empty = show all languages (guests and users with no preference).
   */
  preferredLanguages?: string[]
}

function readTagFromUrl() {
  if (typeof window === "undefined") return ""
  return normalizeHashtag(new URLSearchParams(window.location.search).get("tag") ?? "")
}

function matchesPreferredLanguages(dua: Dua, preferred: string[]) {
  if (preferred.length === 0) return true
  // Prefer the stored language (set by bots / on submission). Fall back to
  // script detection for legacy rows — that only distinguishes en/ar.
  const stored = dua.language?.trim().toLowerCase()
  const lang = stored || detectLanguage(dua.text)
  return preferred.includes(lang)
}

function matchesSearch(dua: Dua, searchQuery: string, categories: Category[]) {
  const trimmed = searchQuery.trim().toLowerCase()
  if (!trimmed) return true

  const categoryName =
    dua.category_name ?? categories.find((category) => category.id === dua.category_id)?.name ?? ""

  return dua.text.toLowerCase().includes(trimmed) || categoryName.toLowerCase().includes(trimmed)
}

export function FeedSection({
  duas,
  categories,
  trendingHashtags,
  pageSize,
  total,
  feedActive = true,
  emptyCopy,
  lockTo,
  preferredLanguages = [],
}: FeedSectionProps) {
  const { query: searchQuery } = useHomeSearch()
  const router = useNavigationRouter()
  const [tag, setTag] = useState("")
  const [extraDuas, setExtraDuas] = useState<Dua[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  // Server count can shrink (duas unpublished) below the total prop captured
  // at render; track the freshest count and stop loading on an empty batch so
  // the loader can never spin forever chasing a stale total.
  const [liveTotal, setLiveTotal] = useState(total)
  const [exhausted, setExhausted] = useState(false)
  const [sentinelVisible, setSentinelVisible] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setLiveTotal(total)
    setExhausted(false)
  }, [total])

  useEffect(() => {
    // Channel/topic page: the filter is fixed by the route, skip URL migration.
    if (lockTo) {
      setTag("")
      return
    }

    const params = new URLSearchParams(window.location.search)
    const legacyCategory = params.get("category")

    // Redirect legacy ?category=<id|handle> to path-based /channels/<handle>.
    if (legacyCategory && legacyCategory !== "all") {
      const match = /^\d+$/.test(legacyCategory)
        ? categories.find((c) => c.id.toString() === legacyCategory)
        : undefined
      const handle = match ? getChannelHandle(match) : legacyCategory
      params.delete("category")
      const query = params.toString()
      router.replace(`/channels/${handle}${query ? `?${query}` : ""}`)
      return
    }

    setTag(readTagFromUrl())
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // The duas prop is the newest server batch; extraDuas holds older batches
  // loaded on demand. Dedupe by id — new submissions shift batch offsets.
  const allDuas = useMemo(() => {
    if (extraDuas.length === 0) return duas
    const seen = new Set(duas.map((dua) => dua.id))
    return [...duas, ...extraDuas.filter((dua) => !seen.has(dua.id))]
  }, [duas, extraDuas])

  const filteredDuas = useMemo(() => {
    return allDuas.filter((dua) => {
      // Channel/topic page: match the locked column (category_id or channel_id).
      if (lockTo && dua[lockTo.field] !== lockTo.id) return false
      if (tag && !matchesHashtag(dua.text, tag)) return false
      if (!matchesPreferredLanguages(dua, preferredLanguages)) return false
      if (!matchesSearch(dua, searchQuery, categories)) return false
      return true
    })
  }, [allDuas, lockTo, categories, preferredLanguages, searchQuery, tag])

  const allLoaded = exhausted || allDuas.length >= liveTotal

  // Watch a sentinel near the end of the list; load the next server batch
  // whenever it scrolls into view and more duas remain.
  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => setSentinelVisible(entries[0]?.isIntersecting ?? false),
      { rootMargin: "600px 0px" },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!sentinelVisible || allLoaded || isLoadingMore || !feedActive) return

    let cancelled = false
    setIsLoadingMore(true)
    getFeedDuas({ offset: allDuas.length })
      .then((result) => {
        if (cancelled) return
        setLiveTotal(result.total)
        if (result.duas.length === 0) {
          setExhausted(true)
          return
        }
        setExtraDuas((previous) => {
          const seen = new Set([...duas, ...previous].map((dua) => dua.id))
          const fresh = result.duas.filter((dua) => !seen.has(dua.id))
          // An all-duplicates batch means offsets shifted and there is nothing
          // new to fetch — treat it as exhausted rather than refetching.
          if (fresh.length === 0) {
            setExhausted(true)
            return previous
          }
          return [...previous, ...fresh]
        })
      })
      .catch((error) => console.error("Error loading more duas:", error))
      .finally(() => {
        if (!cancelled) setIsLoadingMore(false)
      })

    return () => {
      cancelled = true
    }
  }, [sentinelVisible, allLoaded, isLoadingMore, feedActive, allDuas.length, duas])

  const clearTagFilter = useCallback(() => {
    setTag("")
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      params.delete("tag")
      const query = params.toString()
      const pathname = window.location.pathname
      window.history.replaceState(window.history.state, "", query ? `${pathname}?${query}` : pathname)
    }
  }, [])

  const isDefaultFeedView =
    feedActive && !lockTo && tag === "" && searchQuery.trim() === ""

  const newestSeenCreatedAt = filteredDuas[0]?.created_at ?? null

  const { count: newDuasCount, dismiss: dismissNewDuasBanner } = useNewDuasPoll({
    enabled: isDefaultFeedView,
    sinceCreatedAt: newestSeenCreatedAt,
  })

  const handleShowNewDuas = useCallback(() => {
    dismissNewDuasBanner()
    window.scrollTo({ top: 0, behavior: "smooth" })
    router.refresh()
  }, [dismissNewDuasBanner, router])

  return (
    <>
      {tag ? (
        <div className="border-t border-border/60 bg-primary/5 px-4 py-2.5 text-sm text-foreground sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <span className="min-w-0 truncate font-medium">Showing duas tagged #{tag}</span>
            <button
              type="button"
              onClick={clearTagFilter}
              className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Clear
            </button>
          </div>
        </div>
      ) : null}

      <NewDuasBanner count={newDuasCount} onShow={handleShowNewDuas} />

      <section className="min-h-[280px]">
        <DuaList
          duas={filteredDuas}
          emptyTitle={emptyCopy?.homeFeedEmptyTitle}
          emptyDescription={emptyCopy?.homeFeedEmptyDescription}
        />
      </section>

      {/* Infinite-scroll sentinel + status. */}
      <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
      {filteredDuas.length > 0 ? (
        <div className="flex items-center justify-center bg-white px-4 py-6 text-sm text-muted-foreground">
          {isLoadingMore ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
              Loading more duas…
            </span>
          ) : allLoaded ? (
            <span>You&apos;re all caught up.</span>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
