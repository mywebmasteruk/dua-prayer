import type { Metadata } from "next"
import { getFeedDuas, getCategories } from "@/app/actions/duas"
import { getServerUser } from "@/lib/server-user"
import { requireAdmin } from "@/lib/auth"
import { getSiteCopy } from "@/lib/site-copy-server"
import { getChannels } from "@/lib/channels"
import { buildTrendingByLanguage } from "@/lib/hashtags"
import { HomeSearchProvider } from "@/components/home-search-provider"
import { MobileTopBar } from "@/components/mobile-top-bar"
import { HomeSidebarNav } from "@/components/home-sidebar-nav"
import { HomeRightRail } from "@/components/home-right-rail"
import { HomeMobileBottomNav } from "@/components/home-mobile-bottom-nav"
import { ChannelSection } from "@/components/channel-section"
import { NavigationContentLoader } from "@/components/navigation-content-loader"
import { Footer } from "@/components/footer"
import type { Category, Dua } from "@/lib/types/dua"

export const metadata: Metadata = {
  title: "Channels — DuaPrayer",
  description: "Browse community channels and follow the duas that matter most to you.",
}

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

export default async function ChannelsPage() {
  // Cached per request — dedupes with the same call inside getFeedDuas/enrichDuas.
  const user = await getServerUser()
  const [{ isAdmin }, { duas, total }, categories, siteCopy] = await Promise.all([
    user ? requireAdmin() : Promise.resolve({ isAdmin: false }),
    getFeedDuas(),
    getCategories(),
    getSiteCopy(),
  ])

  const channels = getChannels(categories, duas)
  const categoryLeaderboard = getCategoryLeaderboard(categories, duas)
  const trendingByLang = buildTrendingByLanguage(duas)
  const supportedRequests = getTopSupportedDuas(duas)
  const totalAmeens = duas.reduce((sum, dua) => sum + dua.likes, 0)

  return (
    <HomeSearchProvider>
      <div className="min-h-screen bg-muted/40 text-foreground">
        <div className="mx-auto grid w-full max-w-[1265px] lg:grid-cols-[minmax(0,275px)_minmax(0,600px)_minmax(0,350px)] lg:justify-center">
          <aside
            aria-label="Site navigation"
            className="hidden lg:sticky lg:top-0 lg:col-start-1 lg:block lg:h-[calc(100dvh-2rem)] lg:max-h-[calc(100dvh-2rem)] lg:self-start lg:overflow-hidden lg:px-4 lg:pb-0 lg:pt-3"
          >
            <HomeSidebarNav
              user={user}
              isAdmin={isAdmin}
              activePath="/channels"
              sidebarTagline={siteCopy.sidebarTagline}
            />
          </aside>

          <main
            className="min-w-0 bg-white pb-20 lg:col-start-2 lg:border-x lg:border-border/70 lg:pb-0"
            aria-label="Community channels"
          >
            <MobileTopBar />

            <NavigationContentLoader className="min-h-0">
              <header className="border-b border-border/70 px-4 py-4 sm:px-5">
                <h1 className="text-xl font-bold tracking-tight text-foreground">Channels</h1>
                <p className="mt-1 text-sm text-muted-foreground">{siteCopy.channelsPageSubtitle}</p>
              </header>

              <ChannelSection channels={channels} />
              <Footer footerTagline={siteCopy.footerTagline} layout="column" />
            </NavigationContentLoader>
          </main>

          <aside
            aria-label="Community trends and platform context"
            className="hidden lg:sticky lg:top-0 lg:col-start-3 lg:block lg:max-h-[calc(100dvh-2rem)] lg:self-start lg:overflow-y-auto lg:px-4 lg:pb-3"
          >
            <HomeRightRail
              categoryLeaderboard={categoryLeaderboard}
              trendingByLang={trendingByLang}
              supportedRequests={supportedRequests}
              totalDuas={total}
              totalAmeens={totalAmeens}
              categoryCount={categories.filter((c) => c.channel_type === "category").length}
              channelCount={categories.filter((c) => c.channel_type === "user").length}
              compactNumber={compactNumber}
            />
          </aside>
        </div>

        <HomeMobileBottomNav user={user} isAdmin={isAdmin} />
      </div>
    </HomeSearchProvider>
  )
}
