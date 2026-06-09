import Link from "next/link"
import {
  ArrowUpRight,
  Flame,
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

export function HomeRightRail({
  categoryLeaderboard,
  supportedRequests,
  totalDuas,
  totalAmeens,
  categoryCount,
  compactNumber,
}: HomeRightRailProps) {
  return (
    <div className="space-y-4">
      <div
        className="sticky top-0 z-10 flex items-center bg-muted/40"
        style={{ height: HOME_FEED_TAB_BAR_HEIGHT_PX }}
      >
        <HomeSearchInput className="mt-[5px] w-full" />
      </div>

      <section className="rounded-[1.5rem] bg-primary/[0.04] p-3">
        <div className="flex items-center gap-2 px-0.5">
          <Flame className="h-4 w-4 text-muted-foreground/70" aria-hidden="true" />
          <h2 className="text-base font-bold tracking-tight text-foreground/85 lg:text-[20px]">Trending</h2>
          <TrendingInfoTooltip />
        </div>
        <div className="mt-2.5 space-y-1">
          {categoryLeaderboard.map((category, index) => (
            <Link
              key={category.id}
              href={`/?category=${category.id}`}
              aria-label={`${category.name}: ${category.duas} duas and ${category.ameens} ameens`}
              className="flex min-h-10 items-center gap-2.5 rounded-xl border border-transparent bg-muted/40 px-2.5 py-1.5 text-sm transition hover:border-border/60 hover:bg-muted/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background text-[11px] font-medium text-muted-foreground">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium leading-snug text-foreground/85">{category.name}</span>
                <span className="mt-0.5 flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap text-[11px] font-semibold leading-tight text-muted-foreground">
                  <span className="inline-flex shrink-0 items-center gap-1">
                    <MessageCircle className="h-3 w-3 text-muted-foreground/70" aria-hidden="true" />
                    <span className="text-foreground/80">{compactNumber(category.duas)}</span>
                    <span>Duas</span>
                  </span>
                  <span className="shrink-0 text-muted-foreground/60" aria-hidden="true">
                    ·
                  </span>
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <HeartHandshake className="h-3 w-3 shrink-0 text-muted-foreground/70" aria-hidden="true" />
                    <span className="shrink-0 text-foreground/80">{compactNumber(category.ameens)}</span>
                    <span className="truncate">Ameens</span>
                  </span>
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section id="support" className="rounded-[1.5rem] bg-primary/[0.04] p-4">
        <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-muted-foreground">
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          For imams & communities
        </p>
        <div className="mt-3 flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-muted-foreground">
            <HeartHandshake className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-foreground/85 lg:text-[20px]">Start a dua channel</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Imams and community teams can open a shared space for requests, updates, and collective ameen.
              Members can follow activity from a local or online community.
            </p>
          </div>
        </div>
        <Link
          href="/channels/apply"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium text-foreground/85 transition hover:border-border hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Create a channel
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>

      <section className="rounded-[1.5rem] bg-primary/[0.04] p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold tracking-tight text-foreground/85 lg:text-[20px]">Platform activity</h2>
          <LayoutGrid className="h-4 w-4 text-muted-foreground/70" aria-hidden="true" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {[
            { icon: Users, label: "Duas shared", value: compactNumber(totalDuas) },
            { icon: MessageCircle, label: "Ameens shown", value: compactNumber(totalAmeens) },
            { icon: ShieldCheck, label: "Moderated", value: "Yes" },
            { icon: HeartHandshake, label: "Topics", value: String(categoryCount) },
          ].map((signal) => {
            const SignalIcon = signal.icon

            return (
              <div key={signal.label} className="rounded-2xl bg-background/70 p-3">
                <SignalIcon className="h-3.5 w-3.5 text-muted-foreground/70" aria-hidden="true" />
                <p className="mt-2 text-lg font-medium tracking-tight text-foreground/85">{signal.value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{signal.label}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Top supported — temporarily hidden; restore block below when ready to ship */}
      {false && supportedRequests.length > 0 ? (
        <section className="rounded-[1.5rem] bg-primary/[0.04] p-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-muted-foreground/70" aria-hidden="true" />
            <h2 className="text-base font-bold tracking-tight text-foreground/85 lg:text-[20px]">Top supported</h2>
          </div>
          <div className="mt-3 space-y-1.5">
            {supportedRequests.map((request, index) => (
              <a
                key={request.id}
                href="#requests"
                className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2.5 text-sm transition hover:bg-muted/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex min-w-0 items-center gap-2 font-medium text-foreground/85">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background text-xs text-muted-foreground">
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

      <section className="rounded-[1.5rem] bg-primary/[0.04] p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-muted-foreground">
            <LockKeyhole className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-foreground/85 lg:text-[20px]">Safety and privacy</h2>
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
