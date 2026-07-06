"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { UserCheck } from "lucide-react"
import { getFeedDuas } from "@/app/actions/duas"
import type { Category, Dua } from "@/lib/types/dua"
import { DuaList } from "@/components/dua-list"
import { useFollowedChannels } from "@/components/followed-channels-provider"
import { useHomeSearch } from "@/components/home-search-provider"
import type { HomeEmptyCopy } from "@/lib/site-copy"
import { SITE_COPY_DEFAULTS } from "@/lib/site-copy"

interface FollowingSectionProps {
  duas: Dua[]
  categories: Category[]
  pageSize: number
  /** Total published duas on the server (the duas prop is only the first batch). */
  total: number
  followingActive?: boolean
  emptyCopy?: HomeEmptyCopy
}

function matchesSearch(dua: Dua, searchQuery: string, categories: Category[]) {
  const trimmed = searchQuery.trim().toLowerCase()
  if (!trimmed) return true

  const categoryName =
    dua.category_name ?? categories.find((category) => category.id === dua.category_id)?.name ?? ""

  return dua.text.toLowerCase().includes(trimmed) || categoryName.toLowerCase().includes(trimmed)
}

export function FollowingSection({
  duas,
  categories,
  pageSize,
  total,
  followingActive = false,
  emptyCopy = {
    homeFollowingEmptyTitle: SITE_COPY_DEFAULTS.homeFollowingEmptyTitle,
    homeFollowingEmptyDescription: SITE_COPY_DEFAULTS.homeFollowingEmptyDescription,
    homeFollowingEmptyCta: SITE_COPY_DEFAULTS.homeFollowingEmptyCta,
    homeFeedEmptyTitle: SITE_COPY_DEFAULTS.homeFeedEmptyTitle,
    homeFeedEmptyDescription: SITE_COPY_DEFAULTS.homeFeedEmptyDescription,
  },
}: FollowingSectionProps) {
  const { followedIds } = useFollowedChannels()
  const { query: searchQuery } = useHomeSearch()

  // The Following tab filters the global recency feed by followed channels. The
  // duas prop is only the newest batch, so a followed channel whose latest dua
  // sits deeper than page 1 would otherwise never appear. Load older batches on
  // demand (same source as FeedSection) and filter each locally.
  const [extraDuas, setExtraDuas] = useState<Dua[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [liveTotal, setLiveTotal] = useState(total)
  const [exhausted, setExhausted] = useState(false)
  const [sentinelVisible, setSentinelVisible] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setLiveTotal(total)
    setExhausted(false)
  }, [total])

  const allDuas = useMemo(() => {
    if (extraDuas.length === 0) return duas
    const seen = new Set(duas.map((dua) => dua.id))
    return [...duas, ...extraDuas.filter((dua) => !seen.has(dua.id))]
  }, [duas, extraDuas])

  const filteredDuas = useMemo(() => {
    if (followedIds.size === 0) return []

    return allDuas.filter((dua) => {
      // Followed ids can be either topic categories or community channels, so
      // match a dua on whichever axis it carries.
      const isFollowed =
        (dua.category_id != null && followedIds.has(dua.category_id)) ||
        (dua.channel_id != null && followedIds.has(dua.channel_id))
      if (!isFollowed) return false
      return matchesSearch(dua, searchQuery, categories)
    })
  }, [allDuas, categories, followedIds, searchQuery])

  const allLoaded = exhausted || allDuas.length >= liveTotal

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

  // Load the next batch when the tab is active and either we still have fewer
  // than a page of matches (keep pulling so sparse followed content surfaces
  // instead of a false "No matching duas") or the scroll sentinel is in view.
  const shouldLoadMore =
    followingActive &&
    followedIds.size > 0 &&
    !allLoaded &&
    !isLoadingMore &&
    (filteredDuas.length < pageSize || sentinelVisible)

  useEffect(() => {
    if (!shouldLoadMore) return

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
      .catch((error) => console.error("Error loading more followed duas:", error))
      .finally(() => {
        if (!cancelled) setIsLoadingMore(false)
      })

    return () => {
      cancelled = true
    }
  }, [shouldLoadMore, allDuas.length, duas])

  if (followedIds.size === 0) {
    return (
      <section className="flex min-h-[280px] flex-col items-center justify-center px-6 py-16 text-center">
        <div className="rounded-full border border-border/70 bg-muted/40 p-4 text-muted-foreground">
          <UserCheck className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
          {emptyCopy.homeFollowingEmptyTitle}
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          {emptyCopy.homeFollowingEmptyDescription}
        </p>
        <Link
          href="/channels"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {emptyCopy.homeFollowingEmptyCta}
        </Link>
      </section>
    )
  }

  if (filteredDuas.length === 0) {
    // Still pulling batches to look for followed content further down the feed.
    if (!allLoaded) {
      return (
        <section className="flex min-h-[280px] items-center justify-center px-6 py-16 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
            Loading duas from your channels…
          </span>
        </section>
      )
    }

    return (
      <section className="flex min-h-[280px] flex-col items-center justify-center px-6 py-16 text-center">
        <div className="rounded-full border border-border/70 bg-muted/40 p-4 text-muted-foreground">
          <UserCheck className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-lg font-semibold tracking-tight text-foreground">No matching duas</h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          {searchQuery.trim()
            ? "Try a different search or follow more channels."
            : "Duas from your followed channels will appear here as the community shares them."}
        </p>
      </section>
    )
  }

  return (
    <section className="min-h-[280px]">
      <DuaList duas={filteredDuas} />

      <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
      <div className="flex items-center justify-center px-4 py-6 text-sm text-muted-foreground">
        {isLoadingMore ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
            Loading more duas…
          </span>
        ) : allLoaded ? (
          <span>You&apos;re all caught up.</span>
        ) : null}
      </div>
    </section>
  )
}
