import type { ReactNode } from "react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { getSiteCopy } from "@/lib/site-copy"
import { cn } from "@/lib/utils"
import { HomeSidebarNav } from "./home-sidebar-nav"
import { HomeMobileBottomNav } from "./home-mobile-bottom-nav"
import { PageLogoLink } from "./page-logo-link"
import { Footer } from "./footer"

interface InnerPageLayoutProps {
  children: ReactNode
  activePath: string
  showFooter?: boolean
  /** Narrow centered column; defaults to max-w-3xl */
  contentClassName?: string
}

export async function InnerPageLayout({
  children,
  activePath,
  showFooter = true,
  contentClassName = "max-w-3xl",
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
      <div className="mx-auto grid w-full max-w-[1280px] flex-1 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)] lg:justify-center">
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

        <div className="flex min-w-0 flex-col lg:col-start-2">
          <main className={cn("mx-auto w-full flex-1 px-4 py-6 pb-24 lg:px-6 lg:py-10 lg:pb-10", contentClassName)}>
            <PageLogoLink className="mb-6 lg:hidden" />
            {children}
          </main>
          {showFooter ? <Footer footerTagline={siteCopy.footerTagline} /> : null}
        </div>
      </div>

      <HomeMobileBottomNav user={user} isAdmin={isAdmin} />
    </div>
  )
}
