"use client"

import { cn } from "@/lib/utils"

export type LangFilter = "all" | "en" | "ar" | "es" | "ur" | "fr"

interface FeedFiltersProps {
  activeLang: LangFilter
  onLangChange: (value: LangFilter) => void
}

const LANG_OPTIONS: Array<{ id: LangFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "en", label: "EN" },
  { id: "ar", label: "AR" },
  { id: "es", label: "ES" },
  { id: "ur", label: "UR" },
  { id: "fr", label: "FR" },
]

export function FilterPill({
  label,
  count,
  isActive,
  onSelect,
  compact,
}: {
  label: string
  count?: number
  isActive: boolean
  onSelect: () => void
  /** Tighter padding for dense, single-line filter rows. */
  compact?: boolean
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onSelect}
      className={cn(
        "tap-feedback inline-flex shrink-0 items-center rounded-full border text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        compact ? "px-3 py-1" : "px-4 py-1.5",
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

export function FeedFilters({ activeLang, onLangChange }: FeedFiltersProps) {
  return (
    <div className="flex items-stretch bg-white">
      <div className="min-w-0 flex-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div
          className="flex w-max gap-2 px-4 py-3 sm:pl-5"
          role="tablist"
          aria-label="Filter duas by language"
        >
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
