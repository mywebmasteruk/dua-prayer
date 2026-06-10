import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getFeedDuas, getCategories, getTopCategories } from "./actions/duas"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { isSignInOpen, type SignInSearchParams } from "@/lib/auth-modal"
import { getSiteCopy } from "@/lib/site-copy-server"
import { HomeAuthModal } from "@/components/auth/home-auth-modal"
import { HomeSearchProvider } from "@/components/home-search-provider"
import { HomeSearchInput } from "@/components/home-search-input"
import { HomeSidebarNav } from "@/components/home-sidebar-nav"
import { HomeRightRail } from "@/components/home-right-rail"
import { HomeMobileBottomNav } from "@/components/home-mobile-bottom-nav"
import { HomeStreamTabs } from "@/components/home-stream-tabs"
import { BrandLogo } from "@/components/brand-logo"
import { NavigationContentLoader } from "@/components/navigation-content-loader"
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
  searchParams: Promise<SignInSearchParams & { category?: string }>
}) {
  const params = await searchParams
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user && isSignInOpen(params)) {
    redirect(params.next === "/admin" ? "/admin" : "/")
  }

  const { isAdmin } = user ? await requireAdmin() : { isAdmin: false }

  const [{ duas, total, pageSize }, categories, topCategories, siteCopy] = await Promise.all([
    getFeedDuas(),
    getCategories(),
    getTopCategories(3),
    getSiteCopy(),
  ])
  const turnstileSiteKey = isTurnstileEnabled() ? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY : undefined
  const categoryLeaderboard = getCategoryLeaderboard(categories, duas)
  const supportedRequests = getTopSupportedDuas(duas)
  const totalAmeens = duas.reduce((sum, dua) => sum + dua.likes, 0)

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
            className="hidden lg:sticky lg:top-0 lg:col-start-1 lg:block lg:self-start lg:px-4 lg:py-3 lg:text-foreground/70"
          >
            <HomeSidebarNav
              user={user}
              isAdmin={isAdmin}
              activePath="/"
              sidebarTagline="Share your duas, pray for one another, and grow together in faith."
            />
          </aside>

          <main
            className="min-w-0 bg-white pb-20 shadow-[0_24px_80px_rgba(15,23,42,0.045)] lg:col-start-2 lg:pb-0"
            aria-label="Prayer request composer and feed"
          >
            <div className="border-b border-border/70 px-4 py-3 lg:hidden">
              <BrandLogo variant="icon" href="/" showWordmark priority className="h-8 w-8 shrink-0" />
              <div className="mt-3">
                <HomeSearchInput />
              </div>
            </div>

            <NavigationContentLoader className="min-h-0">
              <section id="requests" className="overflow-hidden">
                <HomeStreamTabs
                  categories={categories}
                  turnstileSiteKey={turnstileSiteKey}
                  duas={duas}
                  topCategories={topCategories}
                  pageSize={pageSize}
                  emptyCopy={{
                    homeFeedEmptyTitle: siteCopy.homeFeedEmptyTitle,
                    homeFeedEmptyDescription: siteCopy.homeFeedEmptyDescription,
                    homeFollowingEmptyTitle: siteCopy.homeFollowingEmptyTitle,
                    homeFollowingEmptyDescription: siteCopy.homeFollowingEmptyDescription,
                    homeFollowingEmptyCta: siteCopy.homeFollowingEmptyCta,
                  }}
                />
              </section>
            </NavigationContentLoader>
          </main>

          <aside
            aria-label="Community trends and platform context"
            className="hidden lg:sticky lg:top-0 lg:col-start-3 lg:block lg:self-start lg:px-4 lg:pb-3 lg:text-foreground/65"
          >
            <HomeRightRail
              categoryLeaderboard={categoryLeaderboard}
              supportedRequests={supportedRequests}
              totalDuas={total}
              totalAmeens={totalAmeens}
              categoryCount={categories.length}
              compactNumber={compactNumber}
            />
          </aside>
        </div>

        <HomeMobileBottomNav user={user} isAdmin={isAdmin} />
      </div>
    </HomeSearchProvider>
  )
}
