"use client"

import { FilterPill } from "@/components/feed-filters"

export type ChannelSort = "featured" | "duas" | "ameens" | "name" | "newest"

interface ChannelFiltersProps {
  activeSort: ChannelSort
  followingOnly: boolean
  showFollowingFilter: boolean
  onSortChange: (value: ChannelSort) => void
  onFollowingOnlyChange: (value: boolean) => void
}

const SORT_OPTIONS: Array<{ id: ChannelSort; label: string }> = [
  { id: "featured", label: "Featured" },
  { id: "duas", label: "Most duas" },
  { id: "ameens", label: "Most ameens" },
  { id: "name", label: "A–Z" },
  { id: "newest", label: "Newest" },
]

export function ChannelFilters({
  activeSort,
  followingOnly,
  showFollowingFilter,
  onSortChange,
  onFollowingOnlyChange,
}: ChannelFiltersProps) {
  return (
    <div className="flex items-stretch border-b feed-divider bg-white">
      <div className="min-w-0 flex-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div
          className="flex w-max gap-2 px-4 py-3 sm:pl-5"
          role="tablist"
          aria-label="Sort channels"
        >
          {SORT_OPTIONS.map((option) => (
            <FilterPill
              key={option.id}
              label={option.label}
              isActive={activeSort === option.id}
              onSelect={() => onSortChange(option.id)}
            />
          ))}
        </div>
      </div>

      {showFollowingFilter ? (
        <div className="flex shrink-0 items-center gap-2 py-3 pl-2 pr-4 sm:pr-5">
          <div className="h-5 w-px shrink-0 bg-border/60" aria-hidden="true" />
          <div className="flex shrink-0 gap-2" role="tablist" aria-label="Filter followed channels">
            <FilterPill
              label="Following"
              isActive={followingOnly}
              onSelect={() => onFollowingOnlyChange(!followingOnly)}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
