"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Building2, Flag, Heart, HeartHandshake, Share2, Sparkles, UserRound } from "lucide-react"
import type { Dua } from "@/lib/types/dua"
import { toast } from "@/components/ui/use-toast"
import { prayForDua, flagDua } from "@/app/actions/duas"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { ActionIconTooltip } from "@/components/action-icon-tooltip"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  arabicFontClassName,
  arabicTextSegmentPattern,
  getArabicOnlyFontClassName,
  getTextDirection,
  hasArabicText,
} from "@/lib/detect-language"
import { SITE_COPY_DEFAULTS } from "@/lib/site-copy"

interface DuaListProps {
  duas: Dua[]
  emptyTitle?: string
  emptyDescription?: string
}

function ActionButton({
  children,
  className,
  active,
  tooltip,
  ...props
}: React.ComponentProps<typeof Button> & { active?: boolean; tooltip?: string }) {
  const button = (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "h-8 gap-1.5 rounded-full px-2.5 text-muted-foreground hover:bg-muted hover:text-primary",
        active && "text-primary",
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  )

  if (!tooltip) return button

  return (
    <ActionIconTooltip label={tooltip} disabled={props.disabled}>
      {button}
    </ActionIconTooltip>
  )
}

function renderWithArabicFont(text: string) {
  return text.split(arabicTextSegmentPattern).map((segment, index) =>
    hasArabicText(segment) ? (
      <span key={`${segment}-${index}`} className={arabicFontClassName}>
        {segment}
      </span>
    ) : (
      segment
    ),
  )
}

function formatRelativeTime(value: string) {
  const created = new Date(value)
  if (Number.isNaN(created.getTime())) return ""

  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(created)
}

const sharePlatforms = [
  { id: "whatsapp", label: "Share on WhatsApp", className: "text-[#25D366]" },
  { id: "telegram", label: "Share on Telegram", className: "text-[#26A5E4]" },
  { id: "twitter", label: "Share on X", className: "text-foreground" },
  { id: "facebook", label: "Share on Facebook", className: "text-[#1877F2]" },
] as const

function ShareIcon({ platform }: { platform: (typeof sharePlatforms)[number]["id"] }) {
  const iconClass = "h-4 w-4"

  switch (platform) {
    case "whatsapp":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={iconClass} aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      )
    case "telegram":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={iconClass} aria-hidden="true">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      )
    case "twitter":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={iconClass} aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={iconClass} aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      )
  }
}

export function DuaList({
  duas,
  emptyTitle = SITE_COPY_DEFAULTS.homeFeedEmptyTitle,
  emptyDescription = SITE_COPY_DEFAULTS.homeFeedEmptyDescription,
}: DuaListProps) {
  const [loadingPrays, setLoadingPrays] = useState<Record<number, boolean>>({})
  const [loadingFlags, setLoadingFlags] = useState<Record<number, boolean>>({})
  const [reportedDuas, setReportedDuas] = useState<Record<number, boolean>>({})
  const [lovedDuas, setLovedDuas] = useState<Record<number, boolean>>({})
  const [duasList, setDuasList] = useState<Dua[]>(duas)

  useEffect(() => {
    setDuasList(duas)
  }, [duas])

  const handlePray = async (duaId: number, alreadyPrayed: boolean) => {
    if (alreadyPrayed) {
      toast({ title: "Already prayed", description: "You have already prayed for this dua" })
      return
    }

    setLoadingPrays((prev) => ({ ...prev, [duaId]: true }))
    const result = await prayForDua(duaId)

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else {
      setDuasList((list) =>
        list.map((dua) =>
          dua.id === duaId
            ? { ...dua, likes: result.likes ?? dua.likes + 1, user_has_prayed: true }
            : dua,
        ),
      )
      toast({
        title: result.counted ? "Ameen" : "Already prayed",
        description: result.counted ? "Your prayer has been counted" : "You already prayed for this dua",
      })
    }
    setLoadingPrays((prev) => ({ ...prev, [duaId]: false }))
  }

  const handleFlag = async (duaId: number, isReported: boolean) => {
    if (isReported) {
      setReportedDuas((previous) => ({ ...previous, [duaId]: false }))
      return
    }

    setLoadingFlags((prev) => ({ ...prev, [duaId]: true }))
    const result = await flagDua(duaId)

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else {
      setReportedDuas((previous) => ({ ...previous, [duaId]: true }))
      toast({ title: "Flagged", description: "This dua has been flagged for review" })
    }
    setLoadingFlags((prev) => ({ ...prev, [duaId]: false }))
  }

  const shareOnSocial = (platform: string, dua: Dua) => {
    const text = encodeURIComponent(dua.text)
    const url = encodeURIComponent(window.location.origin)
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${text}%20-%20${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`,
    }
    if (urls[platform]) window.open(urls[platform], "_blank")
  }

  if (duasList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">{emptyTitle}</h2>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{emptyDescription}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 bg-white py-3">
      {duasList.map((dua) => {
        const prayed = dua.user_has_prayed ?? dua.user_has_liked
        const textDirection = getTextDirection(dua.text)
        const isRtl = textDirection === "rtl"
        const isReported = reportedDuas[dua.id] ?? dua.flagged
        const isLoved = Boolean(lovedDuas[dua.id])
        const isChannelPost = dua.category_channel_type === "user"
        const sourceLabel = isChannelPost ? dua.category_name ?? "Community channel" : dua.user_id ? "Community member" : "Anonymous"
        const SourceIcon = isChannelPost ? Building2 : UserRound
        const loveCount = isLoved ? 1 : 0

        return (
          <article
            key={dua.id}
            className="group overflow-hidden bg-white px-4 pt-4 shadow-[0_10px_28px_rgba(15,23,42,0.045)] transition hover:bg-white hover:shadow-[0_14px_36px_rgba(15,23,42,0.06)] focus-within:bg-white sm:px-5"
          >
            <div
              dir={textDirection}
              className={cn("flex flex-wrap items-center gap-x-2 gap-y-1", isRtl && "justify-end text-right")}
            >
              {dua.category_name ? (
                <span className={cn("text-xs font-bold text-primary lg:text-[15px]", getArabicOnlyFontClassName(dua.category_name))}>
                  {renderWithArabicFont(dua.category_name)}
                </span>
              ) : null}
              {dua.category_name ? <span className="text-muted-foreground/45" aria-hidden="true">·</span> : null}
              <span className="text-xs font-normal text-muted-foreground lg:text-[15px]">{formatRelativeTime(dua.created_at)}</span>
            </div>

            <p
              dir={textDirection}
              className={cn(
                "mt-2.5 whitespace-pre-wrap break-words text-[15px] leading-7 text-foreground",
                isRtl ? "text-right font-medium leading-8" : "",
                getArabicOnlyFontClassName(dua.text),
              )}
            >
              {renderWithArabicFont(dua.text)}
            </p>

            <div
              className={cn(
                "-mx-4 mt-4 flex flex-wrap items-center justify-between gap-3 bg-white/95 px-4 py-2.5 opacity-70 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 sm:-mx-5 sm:px-5",
                isRtl && "flex-row-reverse",
              )}
            >
              <div
                dir={textDirection}
                className={cn("flex min-w-0 items-center gap-2 text-xs text-muted-foreground", isRtl && "text-right")}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-transparent text-primary/80">
                  <SourceIcon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span className="truncate text-[12px] font-medium text-foreground/65">{sourceLabel}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <ActionButton
                  active={!!prayed}
                  onClick={() => handlePray(dua.id, !!prayed)}
                  disabled={loadingPrays[dua.id] || prayed}
                  aria-label={prayed ? `Prayed ${dua.likes} times` : `Make ameen for this dua, ${dua.likes} ameens so far`}
                  tooltip={prayed ? "Prayed" : "Ameen"}
                  className="px-1 text-primary"
                >
                  <HeartHandshake className="h-4 w-4" aria-hidden="true" />
                  <span className="text-xs font-semibold tabular-nums">{dua.likes}</span>
                </ActionButton>
                <ActionButton
                  active={isLoved}
                  onClick={() => setLovedDuas((previous) => ({ ...previous, [dua.id]: !previous[dua.id] }))}
                  aria-pressed={isLoved}
                  aria-label={isLoved ? "Remove love from this dua" : "Love this dua"}
                  tooltip={isLoved ? "Unlike" : "Like"}
                  className={cn("px-1", isLoved && "text-primary")}
                >
                  <Heart className="h-4 w-4" aria-hidden="true" />
                  <span className="text-xs font-semibold tabular-nums">{loveCount}</span>
                </ActionButton>
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <ActionButton aria-label="Share dua" className="px-1">
                          <Share2 className="h-4 w-4" aria-hidden="true" />
                        </ActionButton>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Share</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="w-auto p-2">
                    <div className="flex items-center gap-2">
                      {sharePlatforms.map((platform) => (
                        <button
                          key={platform.id}
                          type="button"
                          onClick={() => shareOnSocial(platform.id, dua)}
                          aria-label={platform.label}
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            platform.className,
                          )}
                        >
                          <ShareIcon platform={platform.id} />
                        </button>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                <ActionButton
                  onClick={() => handleFlag(dua.id, isReported)}
                  disabled={loadingFlags[dua.id]}
                  aria-label={isReported ? "Flagged; click to undo" : "Flag this dua"}
                  aria-pressed={isReported}
                  tooltip={isReported ? "Unflag" : "Flag"}
                  className={cn(
                    "px-1",
                    isReported
                      ? "text-red-600 hover:bg-muted/70 hover:text-red-600"
                      : "hover:bg-muted/70 hover:text-red-600",
                  )}
                >
                  <Flag className="h-4 w-4" aria-hidden="true" />
                </ActionButton>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
