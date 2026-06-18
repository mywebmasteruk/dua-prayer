import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getDuas, getFeedDuas, getCategories } from "@/app/actions/duas"
import { getServerUser } from "@/lib/server-user"
import { requireAdmin } from "@/lib/auth"
import { getSiteCopy } from "@/lib/site-copy-server"
import { getPlatformStats } from "@/lib/platform-stats-server"
import { getPostingMode } from "@/lib/posting-settings"
import { HomeSearchProvider } from "@/components/home-search-provider"
import { MobileTopBar } from "@/components/mobile-top-bar"
import { HomeSidebarNav } from "@/components/home-sidebar-nav"
import { HomeRightRail } from "@/components/home-right-rail"
import { HomeMobileBottomNav } from "@/components/home-mobile-bottom-nav"
import { HomeComposer } from "@/components/home-composer"
import { FeedSection } from "@/components/feed-section"
import { NavigationContentLoader } from "@/components/navigation-content-loader"
import { VerifiedChannelBadge } from "@/components/verified-channel-badge"
import { buildTrendingHashtags, buildTrendingByLanguage } from "@/lib/hashtags"
import { isTurnstileEnabled } from "@/lib/turnstile"
import { getChannelHandle } from "@/lib/channels"
import type { Category, Dua } from "@/lib/types/dua"

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
      id: category.id,
      name: category.name,
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>
}): Promise<Metadata> {
  const { handle } = await params
  const categories = await getCategories()
  const channel = categories.find((c) => getChannelHandle(c) === handle)
  if (!channel) return {}

  const description =
    channel.description?.trim() ||
    `Duas and collective ameen in ${channel.name.toLowerCase()}.`

  return {
    title: `${channel.name} — DuaPrayer`,
    description,
  }
}

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params

  const categories = await getCategories()
  const channel = categories.find((c) => getChannelHandle(c) === handle)
  if (!channel) notFound()

  const user = await getServerUser()
  const { isAdmin } = user ? await requireAdmin() : { isAdmin: false }

  // Topic categories filter duas by category_id; community channels by channel_id.
  const isCommunityChannel = channel.channel_type === "user"
  const lockField = isCommunityChannel ? "channel_id" : "category_id"

  const [{ duas, total, pageSize }, channelFirstPage, siteCopy, platformStats, postingMode] =
    await Promise.all([
      getFeedDuas(),
      getDuas(isCommunityChannel ? { channel: channel.id.toString(), page: 1 } : { category: channel.id.toString(), page: 1 }),
      getSiteCopy(),
      getPlatformStats(),
      getPostingMode(),
    ])

  const channelTotal = channelFirstPage.total
  const isVerified = channel.is_verified && channel.status === "approved"
  // Only the channel owner may post into their channel, and they do it from
  // here — the composer is hidden for everyone else and locked to this channel.
  const isChannelOwner = Boolean(user && channel.owner_id === user.id)

  const turnstileSiteKey = isTurnstileEnabled() ? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY : undefined
  const categoryLeaderboard = getCategoryLeaderboard(categories, duas)
  const trendingHashtags = buildTrendingHashtags(duas)
  const trendingByLang = buildTrendingByLanguage(duas)
  const supportedRequests = getTopSupportedDuas(duas)
  const totalAmeens = platformStats.totalAmeens

  return (
    <HomeSearchProvider>
      <div className="min-h-screen bg-muted text-foreground">
        <div className="mx-auto grid w-full max-w-[1265px] lg:grid-cols-[minmax(0,275px)_minmax(0,600px)_minmax(0,350px)] lg:justify-center">
          <aside
            aria-label="Site navigation"
            className="hidden lg:sticky lg:top-0 lg:col-start-1 lg:block lg:h-[calc(100dvh-2rem)] lg:max-h-[calc(100dvh-2rem)] lg:self-start lg:overflow-hidden lg:px-4 lg:pb-0 lg:pt-3 lg:text-foreground/70"
          >
            <HomeSidebarNav
              user={user}
              isAdmin={isAdmin}
              activePath="/channels"
              sidebarTagline={siteCopy.sidebarTagline}
            />
          </aside>

          <main
            className="min-w-0 bg-white pb-20 shadow-[0_24px_80px_rgba(15,23,42,0.045)] lg:col-start-2 lg:pb-0"
            aria-label="Channel composer and feed"
          >
            <MobileTopBar />

            <header className="border-b border-border/70 px-4 py-5 sm:px-5">
              <Link
                href="/channels"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                All channels
              </Link>

              <div className="mt-4 flex items-start gap-4">
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary ring-1 ring-primary/15"
                  aria-hidden="true"
                >
                  {channel.name.trim().charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">{channel.name}</h1>
                    {isVerified ? <VerifiedChannelBadge className="h-5 w-5" /> : null}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">@{handle}</p>
                  {channel.description?.trim() ? (
                    <p className="mt-3 text-sm leading-6 text-foreground/90">{channel.description}</p>
                  ) : null}
                  <p className="mt-3 text-xs text-muted-foreground">
                    {compactNumber(channelTotal)} {channelTotal === 1 ? "dua" : "duas"}
                  </p>
                </div>
              </div>
            </header>

            <NavigationContentLoader className="min-h-0">
              <section id="requests" className="overflow-hidden">
                {isChannelOwner ? (
                <HomeComposer
                  categories={categories}
                  lockedChannel={channel}
                  turnstileSiteKey={turnstileSiteKey}
                  copy={{
                    composerTitleEn: siteCopy.composerTitleEn,
                    composerDescriptionEn: siteCopy.composerDescriptionEn,
                    composerPlaceholderEn: siteCopy.composerPlaceholderEn,
                    composerCategoryPlaceholderEn: siteCopy.composerCategoryPlaceholderEn,
                    composerSubmitEn: siteCopy.composerSubmitEn,
                    composerSubmitAriaEn: siteCopy.composerSubmitAriaEn,
                    composerSubmittingEn: siteCopy.composerSubmittingEn,
                    composerTitleAr: siteCopy.composerTitleAr,
                    composerDescriptionAr: siteCopy.composerDescriptionAr,
                    composerPlaceholderAr: siteCopy.composerPlaceholderAr,
                    composerCategoryPlaceholderAr: siteCopy.composerCategoryPlaceholderAr,
                    composerSubmitAr: siteCopy.composerSubmitAr,
                    composerSubmitAriaAr: siteCopy.composerSubmitAriaAr,
                    composerSubmittingAr: siteCopy.composerSubmittingAr,
                    composerCategoryFamilyAr: siteCopy.composerCategoryFamilyAr,
                    composerCategoryForgivenessAr: siteCopy.composerCategoryForgivenessAr,
                    composerCategoryGeneralAr: siteCopy.composerCategoryGeneralAr,
                    composerCategoryHealthAr: siteCopy.composerCategoryHealthAr,
                    composerCategoryCommunityAr: siteCopy.composerCategoryCommunityAr,
                    composerCategoryGuidanceAr: siteCopy.composerCategoryGuidanceAr,
                    composerCategoryGratitudeAr: siteCopy.composerCategoryGratitudeAr,
                    composerCategoryProtectionAr: siteCopy.composerCategoryProtectionAr,
                  }}
                  postingMode={postingMode}
                  isSignedIn={Boolean(user)}
                  isAdmin={isAdmin}
                />
                ) : null}
                <FeedSection
                  duas={duas}
                  categories={categories}
                  trendingHashtags={trendingHashtags}
                  pageSize={pageSize}
                  total={total}
                  lockTo={{ field: lockField, id: channel.id }}
                  emptyCopy={{
                    homeFeedEmptyTitle: "No duas yet",
                    homeFeedEmptyDescription: "Be the first to share a dua in this channel.",
                  }}
                />
              </section>
            </NavigationContentLoader>
          </main>

          <aside
            aria-label="Community trends and platform context"
            className="hidden lg:sticky lg:top-0 lg:col-start-3 lg:block lg:max-h-[calc(100dvh-2rem)] lg:self-start lg:overflow-y-auto lg:px-4 lg:pb-3 lg:text-foreground/65"
          >
            <HomeRightRail
              categoryLeaderboard={categoryLeaderboard}
              trendingByLang={trendingByLang}
              supportedRequests={supportedRequests}
              totalDuas={total}
              totalAmeens={totalAmeens}
              categoryCount={categories.length}
              compactNumber={compactNumber}
              isSignedIn={Boolean(user)}
            />
          </aside>
        </div>

        <HomeMobileBottomNav user={user} isAdmin={isAdmin} />
      </div>
    </HomeSearchProvider>
  )
}
