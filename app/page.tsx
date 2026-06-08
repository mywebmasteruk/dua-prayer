import { Suspense } from "react"
import Link from "next/link"
import {
  ArrowUpRight,
  Bell,
  Bookmark,
  ChevronRight,
  Clock3,
  Flame,
  HeartHandshake,
  LayoutGrid,
  LockKeyhole,
  MessageCircle,
  Settings2,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react"
import { getDuas, getCategories } from "./actions/duas"
import { HomeComposer } from "@/components/home-composer"
import { DuaList } from "@/components/dua-list"
import { FeedFilters } from "@/components/feed-filters"
import { FeedPagination } from "@/components/feed-pagination"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { Header } from "@/components/header"
import { isTurnstileEnabled } from "@/lib/turnstile"
import type { Dua, Category } from "@/lib/types/dua"

function compactNumber(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)
}

function getCategoryLeaderboard(categories: Category[], duas: Dua[]) {
  const counts = new Map<number, { duas: number; ameens: number }>()

  for (const dua of duas) {
    if (!dua.category_id) continue
    const current = counts.get(dua.category_id) ?? { duas: 0, ameens: 0 }
    counts.set(dua.category_id, { duas: current.duas + 1, ameens: current.ameens + dua.likes })
  }

  return categories
    .map((category) => ({
      ...category,
      duas: counts.get(category.id)?.duas ?? 0,
      ameens: counts.get(category.id)?.ameens ?? 0,
    }))
    .sort((a, b) => b.ameens - a.ameens || b.duas - a.duas || a.name.localeCompare(b.name))
    .slice(0, 5)
}

function getTopSupportedDuas(duas: Dua[]) {
  return [...duas]
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 3)
    .map((dua) => ({
      id: dua.id,
      text: dua.text.length > 54 ? `${dua.text.slice(0, 51).trim()}...` : dua.text,
      ameens: dua.likes,
    }))
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>
}) {
  const params = await searchParams
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { isAdmin } = user ? await requireAdmin() : { isAdmin: false }

  const page = Number.parseInt(params.page ?? "1") || 1
  const { duas, total, pageSize } = await getDuas({ category: params.category, page })
  const categories = await getCategories()
  const turnstileSiteKey = isTurnstileEnabled() ? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY : undefined
  const categoryLeaderboard = getCategoryLeaderboard(categories, duas)
  const supportedRequests = getTopSupportedDuas(duas)
  const isAnonymous = !user

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--accent))_0,transparent_34%),linear-gradient(180deg,#ffffff_0%,hsl(var(--muted))_48%,#ffffff_100%)] text-foreground">
      <Header user={user} isAdmin={isAdmin} />

      <div className="mx-auto grid max-w-[1250px] gap-5 px-4 py-5 lg:grid-cols-[280px_minmax(0,1fr)_320px] lg:px-6 lg:py-8">
        <main className="min-w-0 lg:col-start-2 lg:row-start-1" aria-label="Prayer request composer and feed">
          <section
            id="requests"
            className="overflow-hidden border-x border-border/60 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.05)] backdrop-blur-xl"
          >
            <HomeComposer categories={categories} turnstileSiteKey={turnstileSiteKey} />

            <div className="border-b feed-divider bg-white/90 backdrop-blur">
              <Suspense fallback={<div className="h-12" />}>
                <FeedFilters categories={categories} />
              </Suspense>
            </div>

            <section className="min-h-[280px]">
              <DuaList duas={duas} />
            </section>

            <section className="border-t feed-divider bg-muted/20 px-4 py-3 sm:px-5 sm:py-4">
              <Suspense fallback={null}>
                <FeedPagination page={page} total={total} pageSize={pageSize} />
              </Suspense>
            </section>
          </section>
        </main>

        <aside
          className="space-y-4 md:grid md:grid-cols-2 md:items-start md:gap-4 md:space-y-0 lg:sticky lg:top-24 lg:col-start-1 lg:row-start-1 lg:block lg:space-y-5 lg:self-start"
          aria-label="Your session and account shortcuts"
        >
          <section
            id="about"
            className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-white p-5 shadow-[0_18px_70px_rgba(15,23,42,0.07)] md:col-span-2 lg:col-span-1"
          >
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {isAnonymous ? <UserRound className="h-3.5 w-3.5" aria-hidden="true" /> : <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />}
                {isAnonymous ? "Anonymous session" : "Signed in session"}
              </p>
              <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">
                {isAnonymous ? "Your quiet corner." : "Session saved."}
              </h1>
              {isAnonymous ? (
                <>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    DuaPrayer is a neutral community space for sharing duas, support, and ameen. It is not a
                    religious advisor, scholar, or authority.
                  </p>
                  <Link
                    href="/auth"
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background shadow-sm transition hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    Sign in to save
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </>
              ) : (
                <div className="mt-3 rounded-[1.25rem] border border-border/70 bg-muted/45 p-3">
                  <p className="text-sm font-semibold tracking-tight text-foreground">
                    {user.email ?? "Personal session synced"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Drafts, saved requests, and recent support activity can stay connected to your account.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-border/70 bg-white/90 p-5 shadow-[0_18px_70px_rgba(15,23,42,0.07)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight">My activity</h2>
              <Clock3 className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>

            <div className="mt-4 overflow-hidden rounded-[1.4rem] border border-border/70 bg-white/80">
              {[
                { icon: MessageCircle, label: "Open duas", helper: "Community feed", value: compactNumber(total) },
                { icon: Bookmark, label: "Categories", helper: "Browse topics", value: String(categories.length) },
                { icon: HeartHandshake, label: "Ameens shown", helper: "This page", value: compactNumber(duas.reduce((sum, dua) => sum + dua.likes, 0)) },
                { icon: Bell, label: "Daily digest", helper: "Notifications", value: user ? "On" : "Off" },
              ].map((action) => {
                const ActionIcon = action.icon
                const isDigest = action.label === "Daily digest"

                return (
                  <div
                    key={action.label}
                    className="group flex w-full items-center gap-3 border-b border-border/60 px-3.5 py-3 text-left last:border-b-0"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/10">
                      <ActionIcon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold tracking-tight text-foreground">{action.label}</span>
                      <span className="mt-0.5 block truncate text-xs font-medium text-muted-foreground">{action.helper}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <span
                        className={
                          isDigest
                            ? "rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary"
                            : "min-w-6 text-right text-sm font-semibold tracking-tight text-foreground"
                        }
                      >
                        {action.value}
                      </span>
                      {!isDigest ? <ChevronRight className="h-4 w-4 text-muted-foreground/70" aria-hidden="true" /> : null}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="rounded-[2rem] border border-primary/20 bg-primary/10 p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-primary p-3 text-primary-foreground">
                <Settings2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold tracking-tight text-primary">Community reminder</h2>
                <p className="mt-2 text-sm leading-6 text-accent-foreground">
                  Keep requests kind and avoid private identifying details. Shared duas are public community support.
                </p>
              </div>
            </div>
          </section>
        </aside>

        <aside
          className="space-y-4 md:grid md:grid-cols-2 md:items-start md:gap-4 md:space-y-0 lg:sticky lg:top-24 lg:col-start-3 lg:row-start-1 lg:block lg:space-y-5 lg:self-start"
          aria-label="Community trends and platform context"
        >
          <section className="rounded-[2rem] border border-border/70 bg-white/90 p-5 shadow-[0_18px_70px_rgba(15,23,42,0.07)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-primary" aria-hidden="true" />
                <h2 className="text-lg font-semibold tracking-tight">Trending</h2>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">Live</span>
            </div>
            <div className="mt-4 rounded-2xl border border-border/80 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              Ranked by recent requests and community ameen activity in the live feed.
            </div>
            <div className="mt-4 space-y-2">
              {categoryLeaderboard.map((category, index) => (
                <Link
                  key={category.id}
                  href={`/?category=${category.id}`}
                  aria-label={`${category.name}: ${category.duas} duas and ${category.ameens} ameens`}
                  className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    index === 0
                      ? "border-primary/25 bg-primary/10 shadow-[0_12px_32px_rgba(20,120,78,0.10)]"
                      : "border-transparent bg-muted/55 hover:border-border/70 hover:bg-muted"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      index === 0 ? "bg-primary text-primary-foreground" : "bg-white text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-foreground">{category.name}</span>
                    <span className="mt-1 flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap text-[11px] font-semibold text-muted-foreground">
                      <span className="inline-flex shrink-0 items-center gap-1">
                        <MessageCircle className="h-3 w-3 text-primary" aria-hidden="true" />
                        <span className="text-foreground/80">{compactNumber(category.duas)}</span>
                        <span>Duas</span>
                      </span>
                      <span className="shrink-0 text-muted-foreground/60" aria-hidden="true">·</span>
                      <span className="inline-flex min-w-0 items-center gap-1">
                        <HeartHandshake className="h-3 w-3 shrink-0 text-primary" aria-hidden="true" />
                        <span className="shrink-0 text-foreground/80">{compactNumber(category.ameens)}</span>
                        <span className="truncate">Ameens</span>
                      </span>
                    </span>
                  </span>
                </Link>
              ))}
            </div>
            <p className="mt-4 text-xs font-medium leading-5 text-muted-foreground">
              Counts are community signals, not advice or ranking by religious authority.
            </p>
          </section>

          <section
            id="support"
            className="relative overflow-hidden rounded-[2rem] border border-primary/25 bg-[linear-gradient(145deg,rgba(255,255,255,0.96)_0%,hsl(var(--accent))_54%,rgba(20,120,78,0.14)_100%)] p-5 shadow-[0_22px_80px_rgba(20,120,78,0.16)] md:col-span-2 lg:col-span-1"
          >
            <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-primary/25 blur-3xl" />
            <div className="absolute bottom-4 right-5 h-16 w-16 rounded-full border border-primary/20" />
            <div className="relative">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/75 px-3 py-1 text-xs font-semibold text-primary shadow-sm">
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                For imams & communities
              </p>
              <div className="mt-5 flex items-start gap-3">
                <div className="rounded-2xl bg-primary p-3 text-primary-foreground shadow-[0_12px_28px_rgba(20,120,78,0.22)]">
                  <HeartHandshake className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground">Start a dua channel</h2>
                  <p className="mt-3 text-sm leading-7 text-accent-foreground">
                    Imams and community teams can open a shared space for requests, updates, and collective ameen.
                    Members can follow activity from a local or online community.
                  </p>
                </div>
              </div>
              <Link
                href="/auth"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Create a channel
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </section>

          <section className="rounded-[2rem] border border-border/70 bg-white/90 p-5 shadow-[0_18px_70px_rgba(15,23,42,0.07)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight">Platform activity</h2>
              <LayoutGrid className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                { icon: Users, label: "Duas shared", value: compactNumber(total) },
                { icon: MessageCircle, label: "Ameens shown", value: compactNumber(duas.reduce((sum, dua) => sum + dua.likes, 0)) },
                { icon: ShieldCheck, label: "Moderated", value: "Yes" },
                { icon: HeartHandshake, label: "Topics", value: String(categories.length) },
              ].map((signal) => {
                const SignalIcon = signal.icon

                return (
                  <div key={signal.label} className="rounded-3xl bg-muted/60 p-4">
                    <SignalIcon className="h-4 w-4 text-primary" aria-hidden="true" />
                    <p className="mt-3 text-xl font-semibold tracking-tight">{signal.value}</p>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">{signal.label}</p>
                  </div>
                )
              })}
            </div>
          </section>

          {supportedRequests.length > 0 ? (
            <section className="rounded-[2rem] border border-border/70 bg-white/90 p-5 shadow-[0_18px_70px_rgba(15,23,42,0.07)] backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" aria-hidden="true" />
                <h2 className="text-lg font-semibold tracking-tight">Top supported</h2>
              </div>
              <div className="mt-4 space-y-2">
                {supportedRequests.map((request, index) => (
                  <a
                    key={request.id}
                    href="#requests"
                    className="flex items-center justify-between gap-3 rounded-2xl bg-muted/55 px-3 py-3 text-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex min-w-0 items-center gap-2 font-semibold text-foreground">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
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

          <section className="rounded-[2rem] border border-primary/20 bg-primary/10 p-5 md:col-span-2 lg:col-span-1">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-primary p-3 text-primary-foreground">
                <LockKeyhole className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold tracking-tight text-primary">Safety and privacy</h2>
                <p className="mt-2 text-sm leading-6 text-accent-foreground">
                  Public requests should avoid private identifying details. Community stats are support signals, not
                  fatwa, counseling, or scholarly guidance.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
