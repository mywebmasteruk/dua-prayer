"use client"

import type { TrendingHashtag } from "@/lib/hashtags"
import { cn } from "@/lib/utils"

export type LangFilter = "all" | "en" | "ar"
export type LangPill = Exclude<LangFilter, "all">

interface FeedFiltersProps {
  trendingHashtags: TrendingHashtag[]
  activeTag: string
  activeLang: LangFilter
  onTagChange: (value: string) => void
  onLangChange: (value: LangPill) => void
}

const LANG_OPTIONS: Array<{ id: LangPill; label: string }> = [
  { id: "en", label: "EN" },
  { id: "ar", label: "AR" },
]

export function FilterPill({
  label,
  count,
  isActive,
  onSelect,
}: {
  label: string
  count?: number
  isActive: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onSelect}
      className={cn(
        "tap-feedback inline-flex shrink-0 items-center rounded-full border px-4 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isActive
          ? "border-transparent bg-primary font-semibold text-primary-foreground"
          : "border-transparent bg-transparent font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <span>{label}</span>
      {typeof count === "number" ? (
        <span
          className={cn(
            "ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] leading-none tabular-nums",
            isActive ? "bg-primary-foreground/20 text-primary-foreground/85" : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  )
}

export function FeedFilters({
  trendingHashtags,
  activeTag,
  activeLang,
  onTagChange,
  onLangChange,
}: FeedFiltersProps) {
  const hashtagPills = [{ tag: "", label: "All" }, ...trendingHashtags]

  return (
    <div className="flex items-stretch bg-white">
      <div className="min-w-0 flex-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div
          className="flex w-max gap-2 px-4 py-3 sm:pl-5"
          role="tablist"
          aria-label="Filter duas by trending hashtag"
        >
          {hashtagPills.map((pill) => (
            <FilterPill
              key={pill.tag || "all"}
              label={pill.label}
              count={"duas" in pill ? pill.duas : undefined}
              isActive={activeTag === pill.tag}
              onSelect={() => onTagChange(pill.tag)}
            />
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 py-3 pl-2 pr-4 sm:pr-5">
        <div className="h-5 w-px shrink-0 bg-border/60" aria-hidden="true" />

        <div className="flex shrink-0 gap-2" role="tablist" aria-label="Filter duas by language">
          {LANG_OPTIONS.map((option) => (
            <FilterPill
              key={option.id}
              label={option.label}
              isActive={activeLang === option.id}
              onSelect={() => onLangChange(option.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
