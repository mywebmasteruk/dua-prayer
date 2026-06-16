import Link from "next/link"
import {
  ArrowUpRight,
  HeartHandshake,
  LayoutGrid,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Users,
} from "lucide-react"
import { HomeSearchInput } from "./home-search-input"
import { HOME_FEED_TAB_BAR_HEIGHT_PX } from "./home-feed-tab-bar"
import { TrendingInfoTooltip } from "./trending-info-tooltip"
import { TrendingList } from "./trending-list"
import type { TrendingHashtag } from "@/lib/hashtags"
import type { LangFilter } from "@/components/feed-filters"

export interface CategoryLeaderboardItem {
  id: number
  name: string
  duas: number
  ameens: number
}

export interface SupportedRequestItem {
  id: number
  text: string
  ameens: number
}

interface HomeRightRailProps {
  categoryLeaderboard: CategoryLeaderboardItem[]
  trendingByLang: Record<LangFilter, TrendingHashtag[]>
  supportedRequests: SupportedRequestItem[]
  totalDuas: number
  totalAmeens: number
  categoryCount: number
  compactNumber: (value: number) => string
  isSignedIn?: boolean
}

const rightRailCardClass = "rounded-3xl border border-slate-200/70 bg-slate-50/60 p-4 shadow-sm"
const rightRailHeadingClass = "text-xl font-bold tracking-[-0.03em] text-slate-950"
const rightRailBodyClass = "text-sm leading-6 text-slate-600"

export function HomeRightRail({
  categoryLeaderboard,
  trendingByLang,
  supportedRequests,
  totalDuas,
  totalAmeens,
  categoryCount,
  compactNumber,
  isSignedIn = false,
}: HomeRightRailProps) {
  return (
    <div className="space-y-4">
      <div
        className="sticky top-0 z-10 flex items-center bg-muted/40 backdrop-blur"
        style={{ height: HOME_FEED_TAB_BAR_HEIGHT_PX }}
      >
        <HomeSearchInput className="mt-[5px] w-full" />
      </div>

      <section className={rightRailCardClass}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Community</p>
            <h2 className={rightRailHeadingClass}>Trending</h2>
          </div>
          <TrendingInfoTooltip />
        </div>
        <TrendingList trendingByLang={trendingByLang} categoryLeaderboard={categoryLeaderboard} />
      </section>

      <section id="support" className={rightRailCardClass}>
        <h2 className={rightRailHeadingClass}>Start a dua channel</h2>
        <p className={`${rightRailBodyClass} mt-2`}>
          Create a shared space for a reputable imam, masjid, or organisation to collect requests and respond with ameen.
        </p>
        {!isSignedIn ? (
          <p className="mt-2 text-xs font-medium text-slate-500">Sign in to apply for a channel.</p>
        ) : null}
        <Link
          href="/channels/apply"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Create a channel
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>

      <section className={rightRailCardClass}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Live signals</p>
            <h2 className={rightRailHeadingClass}>Platform activity</h2>
          </div>
          <LayoutGrid className="h-4 w-4 text-muted-foreground/70" aria-hidden="true" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-5 rounded-2xl bg-slate-50 p-4">
          {[
            { icon: Users, label: "Duas shared", value: compactNumber(totalDuas) },
            { icon: MessageCircle, label: "Ameens shown", value: compactNumber(totalAmeens) },
            { icon: ShieldCheck, label: "Moderated", value: "Yes" },
            { icon: HeartHandshake, label: "Topics", value: String(categoryCount) },
          ].map((signal) => {
            const SignalIcon = signal.icon

            return (
              <div key={signal.label} className="min-w-0">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <SignalIcon className="h-3.5 w-3.5 text-primary/70" aria-hidden="true" />
                  <p className="truncate text-[11px] font-medium leading-tight">{signal.label}</p>
                </div>
                <p className="mt-1.5 text-lg font-semibold tracking-tight text-foreground/78">{signal.value}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Top supported — temporarily hidden; restore block below when ready to ship */}
      {false && supportedRequests.length > 0 ? (
        <section className={rightRailCardClass}>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-muted-foreground/70" aria-hidden="true" />
            <h2 className="text-base font-semibold tracking-tight text-foreground/80 lg:text-[18px]">Top supported</h2>
          </div>
          <div className="mt-3 space-y-1.5">
            {supportedRequests.map((request, index) => (
              <a
                key={request.id}
                href="#requests"
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex min-w-0 items-center gap-2 font-medium text-foreground/80">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="truncate">{request.text}</span>
                </span>
                <span className="shrink-0 text-xs font-medium text-muted-foreground">
                  {compactNumber(request.ameens)} ameens
                </span>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <section className={rightRailCardClass}>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
            <LockKeyhole className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-[-0.02em] text-slate-950">Safety and privacy</h2>
            <p className={`${rightRailBodyClass} mt-1.5`}>
              Avoid private identifying details in public requests. Community stats are support signals, not fatwa or counseling.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
