"use client"

import type { Category } from "@/lib/types/dua"
import { cn } from "@/lib/utils"

export type LangFilter = "all" | "en" | "ar"
export type LangPill = Exclude<LangFilter, "all">

interface FeedFiltersProps {
  categories: Category[]
  activeCategory: string
  activeLang: LangFilter
  onCategoryChange: (value: string) => void
  onLangChange: (value: LangPill) => void
}

const LANG_OPTIONS: Array<{ id: LangPill; label: string }> = [
  { id: "en", label: "EN" },
  { id: "ar", label: "AR" },
]

function FilterPill({
  label,
  isActive,
  onSelect,
}: {
  label: string
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
        "tap-feedback shrink-0 rounded-full border px-4 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isActive
          ? "border-border/80 bg-background font-semibold text-foreground shadow-sm"
          : "border-transparent bg-muted/60 font-medium text-muted-foreground hover:border-border/60 hover:bg-muted hover:text-foreground",
      )}
    >
      {label}
    </button>
  )
}

export function FeedFilters({
  categories,
  activeCategory,
  activeLang,
  onCategoryChange,
  onLangChange,
}: FeedFiltersProps) {
  const categoryPills = [{ id: "all", name: "All" }, ...categories.map((cat) => ({ id: cat.id.toString(), name: cat.name }))]

  return (
    <div className="flex items-stretch border-b feed-divider bg-white">
      <div className="min-w-0 flex-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div
          className="flex w-max gap-2 px-4 py-3 sm:pl-5"
          role="tablist"
          aria-label="Filter duas by category"
        >
          {categoryPills.map((pill) => (
            <FilterPill
              key={pill.id}
              label={pill.name}
              isActive={activeCategory === pill.id}
              onSelect={() => onCategoryChange(pill.id)}
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
