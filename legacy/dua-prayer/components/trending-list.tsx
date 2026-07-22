"use client"

import { useState } from "react"
import Link from "next/link"
import { Hash } from "lucide-react"
import { useHomeSearch } from "@/components/home-search-provider"
import { cn } from "@/lib/utils"
import type { LangFilter } from "@/components/feed-filters"
import type { TrendingHashtag } from "@/lib/hashtags"
import type { CategoryLeaderboardItem } from "@/components/home-right-rail"

function compact(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)
}

type TrendingTab = "hashtags" | "topics"

export function TrendingList({
  trendingByLang,
  categoryLeaderboard,
}: {
  trendingByLang: Record<LangFilter, TrendingHashtag[]>
  categoryLeaderboard: CategoryLeaderboardItem[]
}) {
  const { lang } = useHomeSearch()
  const trending = trendingByLang[lang] ?? trendingByLang.all ?? []
  const [tab, setTab] = useState<TrendingTab>("hashtags")

  return (
    <div className="mt-3">
      <div role="tablist" aria-label="Trending" className="flex gap-1 rounded-full bg-slate-100 p-1">
        {(
          [
            { id: "hashtags", label: "Hashtags" },
            { id: "topics", label: "Topics" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              tab === t.id ? "bg-white text-foreground shadow-sm" : "text-slate-500 hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-2 space-y-0.5">
        {tab === "hashtags" ? (
          trending.length > 0 ? (
            trending.map((hashtag, index) => (
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
          ) : (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">No trending hashtags yet.</p>
          )
        ) : categoryLeaderboard.length > 0 ? (
          categoryLeaderboard.map((topic, index) => (
            <Link
              key={topic.id}
              href={`/?category=${topic.id}`}
              aria-label={`${topic.name}: ${topic.duas} duas and ${topic.ameens} ameens`}
              className="group flex min-h-12 items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted/80 text-xs font-semibold tabular-nums text-muted-foreground group-hover:text-primary">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold leading-snug text-foreground/78 group-hover:text-foreground/90">
                  {topic.name}
                </span>
                <span className="mt-1 block truncate text-xs leading-tight text-muted-foreground">
                  {compact(topic.duas)} duas · {compact(topic.ameens)} ameens
                </span>
              </span>
            </Link>
          ))
        ) : (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">No topics yet.</p>
        )}
      </div>
    </div>
  )
}
