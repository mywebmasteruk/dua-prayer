"use client"

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"
import { FilterPill } from "@/components/feed-filters"
import { CHANNEL_TYPE_FILTER_OPTIONS, type ChannelTypeFilter } from "@/lib/channel-types"

export type ChannelSort = "featured" | "duas" | "ameens" | "name" | "newest"
export type ChannelSortDir = "desc" | "asc"

interface ChannelFiltersProps {
  activeSort: ChannelSort
  sortDir: ChannelSortDir
  activeType: ChannelTypeFilter
  followingOnly: boolean
  showFollowingFilter: boolean
  onSortChange: (value: ChannelSort) => void
  onTypeChange: (value: ChannelTypeFilter) => void
  onFollowingOnlyChange: (value: boolean) => void
}

// `directional` sorts toggle between most→least (desc) and least→most (asc)
// and show a direction arrow; the rest are single-direction.
const SORT_OPTIONS: Array<{ id: ChannelSort; label: string; directional?: boolean }> = [
  { id: "featured", label: "Featured" },
  { id: "duas", label: "Dua", directional: true },
  { id: "ameens", label: "Ameen", directional: true },
  { id: "name", label: "A–Z" },
  { id: "newest", label: "Newest" },
]

export function ChannelFilters({
  activeSort,
  sortDir,
  activeType,
  followingOnly,
  showFollowingFilter,
  onSortChange,
  onTypeChange,
  onFollowingOnlyChange,
}: ChannelFiltersProps) {
  const sortArrow = (id: ChannelSort) => {
    if (activeSort !== id) return <ChevronsUpDown className="ml-1 h-3.5 w-3.5 opacity-50" aria-hidden="true" />
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
    ) : (
      <ArrowDown className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
    )
  }
  return (
    <div className="border-b feed-divider bg-white">
      <div className="flex items-stretch">
        <div className="min-w-0 flex-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max items-center gap-1 px-4 py-3 sm:pl-5">
            <div className="flex gap-1" role="tablist" aria-label="Filter channel type">
              {CHANNEL_TYPE_FILTER_OPTIONS.map((option) => (
                <FilterPill
                  key={option.id}
                  label={option.label}
                  isActive={activeType === option.id}
                  onSelect={() => onTypeChange(option.id)}
                  compact
                />
              ))}
            </div>

            <div className="mx-1 h-5 w-px shrink-0 bg-border/60" aria-hidden="true" />

            <div className="flex gap-1" role="tablist" aria-label="Sort channels">
              {SORT_OPTIONS.map((option) => (
                <FilterPill
                  key={option.id}
                  label={option.label}
                  isActive={activeSort === option.id}
                  onSelect={() => onSortChange(option.id)}
                  compact
                  trailing={option.directional ? sortArrow(option.id) : undefined}
                />
              ))}
            </div>
          </div>
        </div>

        {showFollowingFilter ? (
          <div className="flex shrink-0 items-center gap-2 py-3 pl-2 pr-4 sm:pr-5">
            <div className="h-5 w-px shrink-0 bg-border/60" aria-hidden="true" />
            <div className="flex shrink-0" role="tablist" aria-label="Filter followed channels">
              <FilterPill
                label="Following"
                isActive={followingOnly}
                onSelect={() => onFollowingOnlyChange(!followingOnly)}
                compact
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
