"use client"

import Link from "next/link"
import { Hash } from "lucide-react"
import { useHomeSearch } from "@/components/home-search-provider"
import type { LangFilter } from "@/components/feed-filters"
import type { TrendingHashtag } from "@/lib/hashtags"
import type { CategoryLeaderboardItem } from "@/components/home-right-rail"

function compact(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)
}

export function TrendingList({
  trendingByLang,
  categoryLeaderboard,
}: {
  trendingByLang: Record<LangFilter, TrendingHashtag[]>
  categoryLeaderboard: CategoryLeaderboardItem[]
}) {
  const { lang } = useHomeSearch()
  const trending = trendingByLang[lang] ?? trendingByLang.all ?? []

  return (
    <div className="mt-3 space-y-0.5">
      {trending.length > 0
        ? trending.map((hashtag, index) => (
            <a
              key={hashtag.tag}
              href={`/?tag=${encodeURIComponent(hashtag.tag)}`}
              aria-label={`${hashtag.label}: ${hashtag.duas} duas and ${hashtag.ameens} ameens`}
              className="group flex min-h-12 items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary/15">
                {index === 0 ? <Hash className="h-3.5 w-3.5" aria-hidden="true" /> : index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold leading-snug text-foreground/78 group-hover:text-foreground/90">
                  {hashtag.label}
                </span>
                <span className="mt-1 block truncate text-xs leading-tight text-muted-foreground">
                  {compact(hashtag.duas)} duas · {compact(hashtag.ameens)} ameens
                </span>
              </span>
            </a>
          ))
        : categoryLeaderboard.map((category, index) => (
            <Link
              key={category.id}
              href={`/?category=${category.id}`}
              aria-label={`${category.name}: ${category.duas} duas and ${category.ameens} ameens`}
              className="group flex min-h-12 items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted/80 text-xs font-semibold tabular-nums text-muted-foreground group-hover:text-primary">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold leading-snug text-foreground/78 group-hover:text-foreground/90">
                  {category.name}
                </span>
                <span className="mt-1 block truncate text-xs leading-tight text-muted-foreground">
                  {compact(category.duas)} duas · {compact(category.ameens)} ameens
                </span>
              </span>
            </Link>
          ))}
    </div>
  )
}
