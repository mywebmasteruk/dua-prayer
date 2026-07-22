"use client"

import Link from "next/link"
import { useMemo } from "react"
import { UserCheck } from "lucide-react"
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

  const filteredDuas = useMemo(() => {
    if (followedIds.size === 0) return []

    return duas.filter((dua) => {
      // Followed ids can be either topic categories or community channels, so
      // match a dua on whichever axis it carries.
      const isFollowed =
        (dua.category_id != null && followedIds.has(dua.category_id)) ||
        (dua.channel_id != null && followedIds.has(dua.channel_id))
      if (!isFollowed) return false
      return matchesSearch(dua, searchQuery, categories)
    })
  }, [categories, duas, followedIds, searchQuery])

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
    <section className="min-h-[280px]">
      <DuaList duas={filteredDuas} />
    </section>
  )
}
