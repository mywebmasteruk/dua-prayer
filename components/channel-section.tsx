"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ChannelFilters, type ChannelSort } from "@/components/channel-filters"
import { ChannelList, type ChannelItem } from "@/components/channel-list"
import { useFollowedChannels } from "@/components/followed-channels-provider"
import { useHomeSearch } from "@/components/home-search-provider"

interface ChannelSectionProps {
  channels: ChannelItem[]
  channelsActive?: boolean
}

const VALID_SORTS = new Set<ChannelSort>(["featured", "duas", "ameens", "name", "newest"])

function channelHandle(name: string) {
  return name.toLowerCase().replace(/\s+/g, "")
}

function matchesSearch(channel: ChannelItem, searchQuery: string) {
  const trimmed = searchQuery.trim().toLowerCase()
  if (!trimmed) return true

  const handle = channelHandle(channel.name)
  return (
    channel.name.toLowerCase().includes(trimmed) ||
    channel.description.toLowerCase().includes(trimmed) ||
    handle.includes(trimmed) ||
    `@${handle}`.includes(trimmed)
  )
}

function sortChannels(channels: ChannelItem[], sort: ChannelSort) {
  const sorted = [...channels]

  switch (sort) {
    case "duas":
      return sorted.sort(
        (a, b) => b.duaCount - a.duaCount || b.ameenCount - a.ameenCount || a.name.localeCompare(b.name),
      )
    case "ameens":
      return sorted.sort(
        (a, b) => b.ameenCount - a.ameenCount || b.duaCount - a.duaCount || a.name.localeCompare(b.name),
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
    return { sort: "featured" as ChannelSort, followingOnly: false }
  }

  const params = new URLSearchParams(window.location.search)
  const sortParam = params.get("channelSort")
  const sort: ChannelSort = sortParam && VALID_SORTS.has(sortParam as ChannelSort) ? (sortParam as ChannelSort) : "featured"

  return {
    sort,
    followingOnly: params.get("channelFollowing") === "1",
  }
}

function syncChannelFiltersToUrl(sort: ChannelSort, followingOnly: boolean) {
  const params = new URLSearchParams(window.location.search)

  if (sort !== "featured") params.set("channelSort", sort)
  else params.delete("channelSort")

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
  const [followingOnly, setFollowingOnly] = useState(false)

  useEffect(() => {
    const initial = readChannelFiltersFromUrl()
    setSort(initial.sort)
    setFollowingOnly(initial.followingOnly)
  }, [])

  const updateFilters = useCallback((nextSort: ChannelSort, nextFollowingOnly: boolean) => {
    setSort(nextSort)
    setFollowingOnly(nextFollowingOnly)
    if (channelsActive) {
      syncChannelFiltersToUrl(nextSort, nextFollowingOnly)
    }
  }, [channelsActive])

  const handleSortChange = useCallback(
    (value: ChannelSort) => updateFilters(value, followingOnly),
    [followingOnly, updateFilters],
  )

  const handleFollowingOnlyChange = useCallback(
    (value: boolean) => updateFilters(sort, value),
    [sort, updateFilters],
  )

  useEffect(() => {
    if (!channelsActive || !followingOnly) return
    if (followedIds.size === 0) {
      updateFilters(sort, false)
    }
  }, [channelsActive, followedIds.size, followingOnly, sort, updateFilters])

  const filteredChannels = useMemo(() => {
    let result = channels.filter((channel) => matchesSearch(channel, searchQuery))
    if (followingOnly) {
      result = result.filter((channel) => followedIds.has(channel.id))
    }
    return sortChannels(result, sort)
  }, [channels, followedIds, followingOnly, searchQuery, sort])

  const showFollowingFilter = followedIds.size > 0

  return (
    <>
      <ChannelFilters
        activeSort={sort}
        followingOnly={followingOnly}
        showFollowingFilter={showFollowingFilter}
        onSortChange={handleSortChange}
        onFollowingOnlyChange={handleFollowingOnlyChange}
      />
      <ChannelList
        channels={filteredChannels}
        followedIds={followedIds}
        onToggleFollow={toggleFollow}
        hasActiveFilters={searchQuery.trim() !== "" || followingOnly || sort !== "featured"}
      />
    </>
  )
}
