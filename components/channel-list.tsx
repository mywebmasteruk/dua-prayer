"use client"

import { LayoutGrid, Search, UserPlus, UserCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { VerifiedChannelBadge } from "@/components/verified-channel-badge"
import type { ChannelType } from "@/lib/channel-types"

export interface ChannelItem {
  id: number
  name: string
  handle: string
  description: string
  channelType: ChannelType
  isVerified: boolean
  duaCount: number
  ameenCount: number
  sortOrder: number
  createdAt?: string
}

interface ChannelListProps {
  channels: ChannelItem[]
  followedIds: Set<number>
  onToggleFollow: (channelId: number) => void
  hasActiveFilters?: boolean
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)
}

function channelInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?"
}

export function ChannelList({ channels, followedIds, onToggleFollow, hasActiveFilters = false }: ChannelListProps) {
  if (channels.length === 0) {
    const Icon = hasActiveFilters ? Search : LayoutGrid
    const title = hasActiveFilters ? "No channels match" : "No channels yet"
    const description = hasActiveFilters
      ? "Try a different search or sort, or clear the Following filter."
      : "Community channels will appear here as imams and groups open shared spaces for duas and ameen."

    return (
      <section className="flex min-h-[280px] flex-col items-center justify-center px-6 py-16 text-center">
        <div className="rounded-full border border-border/70 bg-muted/40 p-4 text-muted-foreground">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      </section>
    )
  }

  return (
    <section aria-label="Channels to follow" className="divide-y divide-border/70">
      {channels.map((channel) => {
        const isFollowing = followedIds.has(channel.id)

        return (
          <article
            key={channel.id}
            className="flex items-start gap-3 px-4 py-4 transition hover:bg-muted/20 sm:px-5"
          >
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary ring-1 ring-primary/15"
              aria-hidden="true"
            >
              {channelInitial(channel.name)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <h3 className="truncate text-[15px] font-bold text-foreground">{channel.name}</h3>
                    {channel.isVerified ? <VerifiedChannelBadge className="h-4 w-4" /> : null}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">@{channel.handle}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={isFollowing ? "outline" : "default"}
                  onClick={() => onToggleFollow(channel.id)}
                  aria-pressed={isFollowing}
                  className={cn(
                    "h-8 shrink-0 rounded-full px-4 text-sm font-bold",
                    isFollowing && "border-border/70 bg-transparent text-foreground hover:bg-muted/40",
                  )}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                      Follow
                    </>
                  )}
                </Button>
              </div>
              <p className="mt-2 text-sm leading-6 text-foreground/90">{channel.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {compactNumber(channel.duaCount)} duas · {compactNumber(channel.ameenCount)} ameens
              </p>
            </div>
          </article>
        )
      })}
    </section>
  )
}
