"use client"

import { FilterPill } from "@/components/feed-filters"
import { CHANNEL_TYPE_FILTER_OPTIONS, type ChannelTypeFilter } from "@/lib/channel-types"

export type ChannelSort = "featured" | "duas" | "ameens" | "name" | "newest"

interface ChannelFiltersProps {
  activeSort: ChannelSort
  activeType: ChannelTypeFilter
  followingOnly: boolean
  showFollowingFilter: boolean
  onSortChange: (value: ChannelSort) => void
  onTypeChange: (value: ChannelTypeFilter) => void
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
  activeType,
  followingOnly,
  showFollowingFilter,
  onSortChange,
  onTypeChange,
  onFollowingOnlyChange,
}: ChannelFiltersProps) {
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
