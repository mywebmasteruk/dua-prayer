import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getFeedDuas, getCategories } from "./actions/duas"
import { getServerUser } from "@/lib/server-user"
import { accountStatusPostAuthRedirect, getProfileAccessState } from "@/lib/account-status"
import { requireAdmin } from "@/lib/auth"
import { isSignInOpen, type SignInSearchParams } from "@/lib/auth-modal"
import { resolveSignedInSignInRedirect } from "@/lib/home-auth-redirect"
import { getSiteCopy } from "@/lib/site-copy-server"
import { getPlatformStats } from "@/lib/platform-stats-server"
import { getPostingMode } from "@/lib/posting-settings"
import { HomeAuthModal } from "@/components/auth/home-auth-modal"
import { HomeSearchProvider } from "@/components/home-search-provider"
import { HomeSidebarNav } from "@/components/home-sidebar-nav"
import { HomeRightRail } from "@/components/home-right-rail"
import { HomeMobileBottomNav } from "@/components/home-mobile-bottom-nav"
import { HomeStreamTabs } from "@/components/home-stream-tabs"
import { MobileTopBar } from "@/components/mobile-top-bar"
import { NavigationContentLoader } from "@/components/navigation-content-loader"
import { buildTrendingHashtags, buildTrendingByLanguage } from "@/lib/hashtags"
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
  searchParams: Promise<SignInSearchParams & { category?: string; code?: string; tag?: string }>
}) {
  const params = await searchParams

  if (params.code) {
    const callbackParams = new URLSearchParams({ code: params.code })
    if (params.next) callbackParams.set("next", params.next)
    redirect(`/auth/callback?${callbackParams.toString()}`)
  }

  // Cached per request — dedupes with the same call inside getFeedDuas/enrichDuas.
  const user = await getServerUser()

  if (user && isSignInOpen(params)) {
    const access = await getProfileAccessState(user.id)
    const accountStatusDestination = access ? accountStatusPostAuthRedirect(access.accountStatus) : null
    // Only bounce to admin paths when the user actually has admin access — the
    // admin guards redirect non-admins back here with next=/admin, so
    // honoring it blindly creates an infinite redirect loop.
    const { isAdmin } = await requireAdmin()
    redirect(
      resolveSignedInSignInRedirect({
        accountStatusDestination,
        isAdmin,
        next: params.next,
      }),
    )
  }

  const { isAdmin } = user ? await requireAdmin() : { isAdmin: false }

  const [{ duas, total, pageSize }, categories, siteCopy, platformStats, postingMode] = await Promise.all([
    getFeedDuas(),
    getCategories(),
    getSiteCopy(),
    getPlatformStats(),
    getPostingMode(),
  ])
  const turnstileSiteKey = isTurnstileEnabled() ? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY : undefined
  // Leaderboard/trending/supported are derived from the newest batch (recent
  // activity is what these surfaces are for); the totals come from
  // getPlatformStats so they cover ALL duas, not just the loaded batch.
  const categoryLeaderboard = getCategoryLeaderboard(categories, duas)
  const trendingHashtags = buildTrendingHashtags(duas)
  // Per-language trending so the rail can filter with the feed's language pills.
  const trendingByLang = buildTrendingByLanguage(duas)
  const supportedRequests = getTopSupportedDuas(duas)
  const totalAmeens = platformStats.totalAmeens

  return (
    <HomeSearchProvider>
      <Suspense fallback={null}>
        <HomeAuthModal
          initiallyOpen={isSignInOpen(params)}
          error={params.error}
          resetSuccess={params.reset === "success"}
          next={params.next}
        />
      </Suspense>
      <div className="min-h-screen bg-muted text-foreground">
        <div className="mx-auto grid w-full max-w-[1265px] lg:grid-cols-[minmax(0,275px)_minmax(0,600px)_minmax(0,350px)] lg:justify-center">
          <aside
            aria-label="Site navigation"
            className="hidden lg:sticky lg:top-0 lg:col-start-1 lg:block lg:h-[calc(100dvh-2rem)] lg:max-h-[calc(100dvh-2rem)] lg:self-start lg:overflow-hidden lg:px-4 lg:pb-0 lg:pt-3 lg:text-foreground/70"
          >
            <HomeSidebarNav
              user={user}
              isAdmin={isAdmin}
              activePath="/"
              sidebarTagline={siteCopy.sidebarTagline}
            />
          </aside>

          <main
            className="min-w-0 bg-white pb-20 shadow-[0_24px_80px_rgba(15,23,42,0.045)] lg:col-start-2 lg:pb-0"
            aria-label="Prayer request composer and feed"
          >
            <MobileTopBar showCompose />

            <NavigationContentLoader className="min-h-0">
              <section id="requests" className="overflow-hidden">
                <HomeStreamTabs
                  categories={categories}
                  turnstileSiteKey={turnstileSiteKey}
                  duas={duas}
                  trendingHashtags={trendingHashtags}
                  pageSize={pageSize}
                  total={total}
                  emptyCopy={{
                    homeFeedEmptyTitle: siteCopy.homeFeedEmptyTitle,
                    homeFeedEmptyDescription: siteCopy.homeFeedEmptyDescription,
                    homeFollowingEmptyTitle: siteCopy.homeFollowingEmptyTitle,
                    homeFollowingEmptyDescription: siteCopy.homeFollowingEmptyDescription,
                    homeFollowingEmptyCta: siteCopy.homeFollowingEmptyCta,
                  }}
                  postingMode={postingMode}
                  isSignedIn={Boolean(user)}
                  isAdmin={isAdmin}
                  composerCopy={{
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
