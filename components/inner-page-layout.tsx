import type { ReactNode } from "react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { getSiteCopy } from "@/lib/site-copy-server"
import { cn } from "@/lib/utils"
import { HomeSidebarNav } from "./home-sidebar-nav"
import { HomeMobileBottomNav } from "./home-mobile-bottom-nav"
import { PageLogoLink } from "./page-logo-link"
import { Footer } from "./footer"
import { NavigationContentLoader } from "./navigation-content-loader"

interface InnerPageLayoutProps {
  children: ReactNode
  activePath: string
  showFooter?: boolean
  /** Optional max-width constraint inside the center+right content area */
  contentClassName?: string
}

export async function InnerPageLayout({
  children,
  activePath,
  showFooter = true,
  contentClassName,
}: InnerPageLayoutProps) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const [{ isAdmin }, siteCopy] = await Promise.all([
    user ? requireAdmin() : Promise.resolve({ isAdmin: false }),
    getSiteCopy(),
  ])

  return (
    <div className="flex min-h-screen flex-col bg-muted/40 text-foreground">
      <div className="mx-auto grid w-full max-w-[1265px] flex-1 lg:grid-cols-[minmax(0,275px)_minmax(0,600px)_minmax(0,350px)] lg:justify-center">
        <aside
          aria-label="Site navigation"
          className="hidden lg:sticky lg:top-0 lg:col-start-1 lg:block lg:self-start lg:px-4 lg:py-3"
        >
          <HomeSidebarNav
            user={user}
            isAdmin={isAdmin}
            activePath={activePath}
            sidebarTagline={siteCopy.sidebarTagline}
          />
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white pb-20 lg:col-span-2 lg:col-start-2 lg:border-l lg:border-border/70 lg:pb-0">
          <main
            className={cn(
              "w-full flex-1 px-4 py-6 lg:px-6 lg:py-10",
              contentClassName,
              contentClassName?.includes("max-w") && "mx-auto",
            )}
          >
            <PageLogoLink className="mb-6 lg:hidden" />
            <NavigationContentLoader>{children}</NavigationContentLoader>
          </main>
          {showFooter ? (
            <Footer footerTagline={siteCopy.footerTagline} layout="column" />
          ) : null}
        </div>
      </div>

      <HomeMobileBottomNav user={user} isAdmin={isAdmin} />
    </div>
  )
}
