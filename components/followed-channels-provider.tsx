"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { loadFollowedChannelIds, saveFollowedChannelIds, FOLLOWED_CHANNELS_STORAGE_KEY } from "@/lib/followed-channels-storage"

interface FollowedChannelsContextValue {
  followedIds: Set<number>
  toggleFollow: (channelId: number) => void
  isFollowing: (channelId: number) => boolean
}

const FollowedChannelsContext = createContext<FollowedChannelsContextValue | null>(null)

export function FollowedChannelsProvider({ children }: { children: ReactNode }) {
  const [followedIds, setFollowedIds] = useState<Set<number>>(() => new Set())
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setFollowedIds(loadFollowedChannelIds())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    saveFollowedChannelIds(followedIds)
  }, [followedIds, hydrated])

  useEffect(() => {
    if (!hydrated) return

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== FOLLOWED_CHANNELS_STORAGE_KEY) return
      setFollowedIds(loadFollowedChannelIds())
    }

    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [hydrated])

  const toggleFollow = useCallback((channelId: number) => {
    setFollowedIds((current) => {
      const next = new Set(current)
      if (next.has(channelId)) next.delete(channelId)
      else next.add(channelId)
      return next
    })
  }, [])

  const isFollowing = useCallback((channelId: number) => followedIds.has(channelId), [followedIds])

  const value = useMemo(
    () => ({ followedIds, toggleFollow, isFollowing }),
    [followedIds, isFollowing, toggleFollow],
  )

  return <FollowedChannelsContext.Provider value={value}>{children}</FollowedChannelsContext.Provider>
}

export function useFollowedChannels() {
  const context = useContext(FollowedChannelsContext)
  if (!context) {
    throw new Error("useFollowedChannels must be used within FollowedChannelsProvider")
  }
  return context
}
