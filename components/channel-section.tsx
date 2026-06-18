"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ChannelFilters, type ChannelSort, type ChannelSortDir } from "@/components/channel-filters"
import { ChannelList, type ChannelItem } from "@/components/channel-list"
import { useFollowedChannels } from "@/components/followed-channels-provider"
import { useHomeSearch } from "@/components/home-search-provider"
import type { ChannelTypeFilter } from "@/lib/channel-types"

interface ChannelSectionProps {
  channels: ChannelItem[]
  channelsActive?: boolean
}

const VALID_SORTS = new Set<ChannelSort>(["featured", "duas", "ameens", "name", "newest"])
const VALID_TYPES = new Set<ChannelTypeFilter>(["all", "category", "user"])
// Sorts whose direction can be toggled (most⇄least) and that show an arrow.
const DIRECTIONAL_SORTS = new Set<ChannelSort>(["duas", "ameens"])

function matchesSearch(channel: ChannelItem, searchQuery: string) {
  const trimmed = searchQuery.trim().toLowerCase()
  if (!trimmed) return true

  return (
    channel.name.toLowerCase().includes(trimmed) ||
    channel.description.toLowerCase().includes(trimmed) ||
    channel.handle.includes(trimmed) ||
    `@${channel.handle}`.includes(trimmed)
  )
}

function sortChannels(channels: ChannelItem[], sort: ChannelSort, dir: ChannelSortDir) {
  const sorted = [...channels]
  // Flip the count comparison for ascending (least→most); name stays A–Z.
  const f = dir === "asc" ? -1 : 1

  switch (sort) {
    case "duas":
      return sorted.sort(
        (a, b) => f * (b.duaCount - a.duaCount) || f * (b.ameenCount - a.ameenCount) || a.name.localeCompare(b.name),
      )
    case "ameens":
      return sorted.sort(
        (a, b) => f * (b.ameenCount - a.ameenCount) || f * (b.duaCount - a.duaCount) || a.name.localeCompare(b.name),
      )
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    case "newest":
      return sorted.sort((a, b) => {
        const aTime = a.createdAt ? Date.parse(a.createdAt) : 0
        const bTime = b.createdAt ? Date.parse(b.createdAt) : 0
        return bTime - aTime || a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)
      })
    case "featured":
    default:
      return sorted.sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          b.ameenCount - a.ameenCount ||
          b.duaCount - a.duaCount ||
          a.name.localeCompare(b.name),
      )
  }
}

function readChannelFiltersFromUrl() {
  if (typeof window === "undefined") {
    return {
      sort: "featured" as ChannelSort,
      sortDir: "desc" as ChannelSortDir,
      type: "all" as ChannelTypeFilter,
      followingOnly: false,
    }
  }

  const params = new URLSearchParams(window.location.search)
  const sortParam = params.get("channelSort")
  const typeParam = params.get("channelType")
  const sort: ChannelSort = sortParam && VALID_SORTS.has(sortParam as ChannelSort) ? (sortParam as ChannelSort) : "featured"
  const type: ChannelTypeFilter =
    typeParam && VALID_TYPES.has(typeParam as ChannelTypeFilter) ? (typeParam as ChannelTypeFilter) : "all"
  const sortDir: ChannelSortDir =
    params.get("channelSortDir") === "asc" && DIRECTIONAL_SORTS.has(sort) ? "asc" : "desc"

  return {
    sort,
    sortDir,
    type,
    followingOnly: params.get("channelFollowing") === "1",
  }
}

function syncChannelFiltersToUrl(
  sort: ChannelSort,
  sortDir: ChannelSortDir,
  type: ChannelTypeFilter,
  followingOnly: boolean,
) {
  const params = new URLSearchParams(window.location.search)

  if (sort !== "featured") params.set("channelSort", sort)
  else params.delete("channelSort")

  if (sortDir === "asc" && DIRECTIONAL_SORTS.has(sort)) params.set("channelSortDir", "asc")
  else params.delete("channelSortDir")

  if (type !== "all") params.set("channelType", type)
  else params.delete("channelType")

  if (followingOnly) params.set("channelFollowing", "1")
  else params.delete("channelFollowing")

  const query = params.toString()
  const nextUrl = query ? `/channels?${query}` : "/channels"
  const currentUrl = `${window.location.pathname}${window.location.search}`

  if (currentUrl !== nextUrl) {
    window.history.replaceState(window.history.state, "", nextUrl)
  }
}

export function ChannelSection({ channels, channelsActive = true }: ChannelSectionProps) {
  const { query: searchQuery } = useHomeSearch()
  const { followedIds, toggleFollow } = useFollowedChannels()
  const [sort, setSort] = useState<ChannelSort>("featured")
  const [sortDir, setSortDir] = useState<ChannelSortDir>("desc")
  const [type, setType] = useState<ChannelTypeFilter>("all")
  const [followingOnly, setFollowingOnly] = useState(false)

  useEffect(() => {
    const initial = readChannelFiltersFromUrl()
    setSort(initial.sort)
    setSortDir(initial.sortDir)
    setType(initial.type)
    setFollowingOnly(initial.followingOnly)
  }, [])

  const updateFilters = useCallback(
    (nextSort: ChannelSort, nextSortDir: ChannelSortDir, nextType: ChannelTypeFilter, nextFollowingOnly: boolean) => {
      setSort(nextSort)
      setSortDir(nextSortDir)
      setType(nextType)
      setFollowingOnly(nextFollowingOnly)
      if (channelsActive) {
        syncChannelFiltersToUrl(nextSort, nextSortDir, nextType, nextFollowingOnly)
      }
    },
    [channelsActive],
  )

  const handleSortChange = useCallback(
    (value: ChannelSort) => {
      // Re-selecting an active directional sort flips its direction; any other
      // selection starts that sort at its default (most→least / desc).
      const nextDir: ChannelSortDir =
        DIRECTIONAL_SORTS.has(value) && value === sort && sortDir === "desc" ? "asc" : "desc"
      updateFilters(value, nextDir, type, followingOnly)
    },
    [followingOnly, sort, sortDir, type, updateFilters],
  )

  const handleTypeChange = useCallback(
    (value: ChannelTypeFilter) => updateFilters(sort, sortDir, value, followingOnly),
    [followingOnly, sort, sortDir, updateFilters],
  )

  const handleFollowingOnlyChange = useCallback(
    (value: boolean) => updateFilters(sort, sortDir, type, value),
    [sort, sortDir, type, updateFilters],
  )

  useEffect(() => {
    if (!channelsActive || !followingOnly) return
    if (followedIds.size === 0) {
      updateFilters(sort, sortDir, type, false)
    }
  }, [channelsActive, followedIds.size, followingOnly, sort, sortDir, type, updateFilters])

  const filteredChannels = useMemo(() => {
    let result = channels.filter((channel) => matchesSearch(channel, searchQuery))
    if (type !== "all") {
      result = result.filter((channel) => channel.channelType === type)
    }
    if (followingOnly) {
      result = result.filter((channel) => followedIds.has(channel.id))
    }
    return sortChannels(result, sort, sortDir)
  }, [channels, followedIds, followingOnly, searchQuery, sort, sortDir, type])

  const showFollowingFilter = followedIds.size > 0

  return (
    <>
      <ChannelFilters
        activeSort={sort}
        sortDir={sortDir}
        activeType={type}
        followingOnly={followingOnly}
        showFollowingFilter={showFollowingFilter}
        onSortChange={handleSortChange}
        onTypeChange={handleTypeChange}
        onFollowingOnlyChange={handleFollowingOnlyChange}
      />
      <ChannelList
        channels={filteredChannels}
        followedIds={followedIds}
        onToggleFollow={toggleFollow}
        hasActiveFilters={
          searchQuery.trim() !== "" || followingOnly || sort !== "featured" || type !== "all"
        }
      />
    </>
  )
}
