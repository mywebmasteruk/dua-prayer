"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import { followChannel, unfollowChannel } from "@/app/actions/follows"
import { useNavigationRouter } from "@/hooks/use-navigation-router"
import { signInHref } from "@/lib/auth-modal"
import { toast } from "@/components/ui/use-toast"

interface FollowedChannelsContextValue {
  followedIds: Set<number>
  toggleFollow: (channelId: number) => void
  isFollowing: (channelId: number) => boolean
}

const FollowedChannelsContext = createContext<FollowedChannelsContextValue | null>(null)

interface FollowedChannelsProviderProps {
  children: ReactNode
  /** Channel ids the signed-in user already follows (from the server). */
  initialFollowedIds?: number[]
  /** Follows are account-tied; guests are sent to sign-in when they try. */
  isSignedIn: boolean
}

export function FollowedChannelsProvider({
  children,
  initialFollowedIds = [],
  isSignedIn,
}: FollowedChannelsProviderProps) {
  const [followedIds, setFollowedIds] = useState<Set<number>>(() => new Set(initialFollowedIds))
  const router = useNavigationRouter()

  const toggleFollow = useCallback(
    (channelId: number) => {
      if (!isSignedIn) {
        router.push(signInHref({ next: "/channels" }))
        return
      }

      const wasFollowing = followedIds.has(channelId)
      // Optimistic update; revert if the server call fails.
      setFollowedIds((current) => {
        const next = new Set(current)
        if (wasFollowing) next.delete(channelId)
        else next.add(channelId)
        return next
      })

      const run = wasFollowing ? unfollowChannel : followChannel
      run(channelId).then((result) => {
        if (result && "error" in result && result.error) {
          setFollowedIds((current) => {
            const next = new Set(current)
            if (wasFollowing) next.add(channelId)
            else next.delete(channelId)
            return next
          })
          toast({ title: "Could not update follow", description: result.error, variant: "destructive" })
        }
      })
    },
    [followedIds, isSignedIn, router],
  )

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
