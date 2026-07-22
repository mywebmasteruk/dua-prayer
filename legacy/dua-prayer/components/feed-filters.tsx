"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

// Feed language is now a saved account preference (see Account → Preferences),
// not a live pill row, but the type is still used by the search context.
export type LangFilter = "all" | "en" | "ar" | "es" | "ur" | "fr"

export function FilterPill({
  label,
  count,
  isActive,
  onSelect,
  compact,
  trailing,
}: {
  label: string
  count?: number
  isActive: boolean
  onSelect: () => void
  /** Tighter padding for dense, single-line filter rows. */
  compact?: boolean
  /** Optional element rendered after the label (e.g. a sort-direction arrow). */
  trailing?: ReactNode
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
          ? "border-transparent bg-primary/15 font-semibold text-primary"
          : "border-transparent bg-transparent font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <span>{label}</span>
      {trailing}
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
