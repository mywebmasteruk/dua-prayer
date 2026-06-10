"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { UserCheck } from "lucide-react"
import type { Category, Dua } from "@/lib/types/dua"
import { DuaList } from "@/components/dua-list"
import { FeedPagination } from "@/components/feed-pagination"
import { useFollowedChannels } from "@/components/followed-channels-provider"
import { useHomeSearch } from "@/components/home-search-provider"
import type { HomeEmptyCopy } from "@/lib/site-copy"
import { SITE_COPY_DEFAULTS } from "@/lib/site-copy"

interface FollowingSectionProps {
  duas: Dua[]
  categories: Category[]
  pageSize: number
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

// Uses ?fpage= so it never collides with the feed tab's ?page= param.
function readFollowingPageFromUrl() {
  if (typeof window === "undefined") return 1
  return Math.max(1, Number.parseInt(new URLSearchParams(window.location.search).get("fpage") ?? "1") || 1)
}

function syncFollowingPageToUrl(page: number) {
  const params = new URLSearchParams(window.location.search)
  params.set("tab", "following")

  if (page > 1) params.set("fpage", String(page))
  else params.delete("fpage")

  const query = params.toString()
  const nextUrl = query ? `/?${query}` : "/"
  const currentUrl = `${window.location.pathname}${window.location.search}`

  if (currentUrl !== nextUrl) {
    window.history.replaceState(window.history.state, "", nextUrl)
  }
}

export function FollowingSection({
  duas,
  categories,
  pageSize,
  followingActive = true,
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
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(readFollowingPageFromUrl())
  }, [])

  const filteredDuas = useMemo(() => {
    if (followedIds.size === 0) return []

    return duas.filter((dua) => {
      if (!dua.category_id || !followedIds.has(dua.category_id)) return false
      return matchesSearch(dua, searchQuery, categories)
    })
  }, [categories, duas, followedIds, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredDuas.length / pageSize))
  const currentPage = Math.min(page, totalPages)

  const paginatedDuas = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredDuas.slice(start, start + pageSize)
  }, [currentPage, filteredDuas, pageSize])

  useEffect(() => {
    if (page !== currentPage) setPage(currentPage)
  }, [currentPage, page])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, followedIds.size])

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setPage(nextPage)
      if (followingActive) syncFollowingPageToUrl(nextPage)
    },
    [followingActive],
  )

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
    <>
      <section className="min-h-[280px]">
        <DuaList duas={paginatedDuas} />
      </section>

      <section className="border-t feed-divider bg-white px-4 py-3 sm:px-5 sm:py-4">
        <FeedPagination
          page={currentPage}
          total={filteredDuas.length}
          pageSize={pageSize}
          onPageChange={handlePageChange}
        />
      </section>
    </>
  )
}
