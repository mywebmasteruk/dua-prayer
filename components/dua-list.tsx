"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Flag, Heart, Share2, Sparkles, UserRound } from "lucide-react"
import { PrayerHandsIcon } from "@/components/icons/prayer-hands"
import type { Dua } from "@/lib/types/dua"
import { toast } from "@/components/ui/use-toast"
import { prayForDua, flagDua } from "@/app/actions/duas"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { ActionIconTooltip } from "@/components/action-icon-tooltip"
import {
  arabicFontClassName,
  arabicTextSegmentPattern,
  getArabicOnlyFontClassName,
  getTextDirection,
  hasArabicText,
} from "@/lib/detect-language"

interface DuaListProps {
  duas: Dua[]
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
        "h-8 gap-1.5 rounded-full px-2.5 text-muted-foreground hover:bg-primary/10 hover:text-primary",
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

export function DuaList({ duas }: DuaListProps) {
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
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent">
          <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">No duas yet</h2>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
          Be the first to share a dua. Your words can lift someone across the Ummah.
        </p>
      </div>
    )
  }

  return (
    <div>
      {duasList.map((dua) => {
        const prayed = dua.user_has_prayed ?? dua.user_has_liked
        const textDirection = getTextDirection(dua.text)
        const isRtl = textDirection === "rtl"
        const isReported = reportedDuas[dua.id] ?? dua.flagged
        const isLoved = Boolean(lovedDuas[dua.id])
        const sourceLabel = dua.user_id ? "Community member" : "Anonymous"
        const loveCount = isLoved ? 1 : 0

        return (
          <article
            key={dua.id}
            className="group border-b feed-divider px-4 pt-3.5 transition hover:bg-muted/20 focus-within:bg-muted/20 last:border-b-0 sm:px-5"
          >
            <div
              dir={textDirection}
              className={cn("flex flex-wrap items-center gap-x-2 gap-y-1", isRtl && "justify-end text-right")}
            >
              {dua.category_name ? (
                <span className={cn("text-xs font-semibold text-primary", getArabicOnlyFontClassName(dua.category_name))}>
                  {renderWithArabicFont(dua.category_name)}
                </span>
              ) : null}
              {dua.category_name ? <span className="text-muted-foreground/45" aria-hidden="true">·</span> : null}
              <span className="text-xs font-medium text-muted-foreground">{formatRelativeTime(dua.created_at)}</span>
            </div>

            <p
              dir={textDirection}
              className={cn(
                "mt-2.5 whitespace-pre-wrap break-words text-[15px] text-slate-800 sm:text-base",
                isRtl ? "text-right font-medium leading-8 sm:leading-8" : "leading-7 sm:leading-7",
                getArabicOnlyFontClassName(dua.text),
              )}
            >
              {renderWithArabicFont(dua.text)}
            </p>

            <div
              className={cn(
                "-mx-4 mt-3 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60 px-4 py-2.5 transition group-hover:bg-slate-50/80 sm:-mx-5 sm:px-5",
                isRtl && "flex-row-reverse",
              )}
            >
              <div
                dir={textDirection}
                className={cn("flex min-w-0 items-center gap-2 text-xs font-semibold text-muted-foreground", isRtl && "text-right")}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary">
                  <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span className="truncate">{sourceLabel}</span>
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
                  <PrayerHandsIcon className="h-4 w-4" aria-hidden="true" />
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
                  <DropdownMenuTrigger asChild>
                    <ActionButton aria-label="Share dua" tooltip="Share" className="px-1">
                      <Share2 className="h-4 w-4" aria-hidden="true" />
                    </ActionButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => shareOnSocial("whatsapp", dua)}>WhatsApp</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => shareOnSocial("telegram", dua)}>Telegram</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => shareOnSocial("twitter", dua)}>X</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => shareOnSocial("facebook", dua)}>Facebook</DropdownMenuItem>
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
