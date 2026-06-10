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
  supportedRequests: SupportedRequestItem[]
  totalDuas: number
  totalAmeens: number
  categoryCount: number
  compactNumber: (value: number) => string
}

const rightRailCardClass = "rounded-[1.5rem] bg-white p-4 shadow-[0_14px_38px_rgba(15,23,42,0.04)]"

export function HomeRightRail({
  categoryLeaderboard,
  supportedRequests,
  totalDuas,
  totalAmeens,
  categoryCount,
  compactNumber,
}: HomeRightRailProps) {
  return (
    <div className="space-y-4 opacity-90">
      <div
        className="sticky top-0 z-10 flex items-center bg-muted/80 backdrop-blur"
        style={{ height: HOME_FEED_TAB_BAR_HEIGHT_PX }}
      >
        <HomeSearchInput className="mt-[5px] w-full" />
      </div>

      <section className={rightRailCardClass}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Community</p>
            <h2 className="mt-1 text-[17px] font-semibold tracking-tight text-foreground/80">Trending</h2>
          </div>
          <TrendingInfoTooltip />
        </div>
        <div className="mt-3 space-y-0.5">
          {categoryLeaderboard.map((category, index) => (
            <Link
              key={category.id}
              href={`/?category=${category.id}`}
              aria-label={`${category.name}: ${category.duas} duas and ${category.ameens} ameens`}
              className="group flex min-h-12 items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted/80 text-xs font-semibold tabular-nums text-muted-foreground group-hover:text-primary">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold leading-snug text-foreground/78 group-hover:text-foreground/90">
                  {category.name}
                </span>
                <span className="mt-1 block truncate text-xs leading-tight text-muted-foreground">
                  {compactNumber(category.duas)} duas · {compactNumber(category.ameens)} ameens
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section id="support" className={rightRailCardClass}>
        <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted/80 text-primary" aria-hidden="true">
            <Users className="h-3.5 w-3.5" />
          </span>
          Channels
        </p>
        <div className="mt-3">
          <h2 className="text-[17px] font-semibold tracking-tight text-foreground/85">Start a dua channel</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Imams and community teams can open a shared space for requests, updates, and collective ameen.
          </p>
          <p className="mt-2 text-xs font-medium text-muted-foreground">Register or login to use this feature.</p>
        </div>
        <Link
          href="/channels/apply"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary/90 px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Create a channel
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>

      <section className={rightRailCardClass}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Live signals</p>
            <h2 className="mt-1 text-[17px] font-semibold tracking-tight text-foreground/80">Platform activity</h2>
          </div>
          <LayoutGrid className="h-4 w-4 text-muted-foreground/70" aria-hidden="true" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-5 rounded-[1.25rem] bg-muted/55 p-4">
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

      <section className="rounded-[1.5rem] bg-white p-4 opacity-80 shadow-[0_12px_34px_rgba(15,23,42,0.025)]">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <LockKeyhole className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground/75 lg:text-[17px]">Safety and privacy</h2>
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
              Public requests should avoid private identifying details. Community stats are support signals, not fatwa,
              counseling, or scholarly guidance.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
