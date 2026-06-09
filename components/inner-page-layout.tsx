import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getAdminContext } from "@/lib/auth"
import { signInHref } from "@/lib/auth-modal"
import { getServerUserAdminFlag } from "@/lib/layout-auth"
import { getSiteCopy } from "@/lib/site-copy-server"
import { adminContentClassName } from "@/components/admin/admin-layout"
import { cn } from "@/lib/utils"
import { AdminMobileNav } from "./admin/admin-mobile-nav"
import { AdminSidebarNav } from "./admin/admin-sidebar-nav"
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

function isAdminRoute(activePath: string) {
  return activePath === "/admin" || activePath.startsWith("/admin/")
}

export async function InnerPageLayout({
  children,
  activePath,
  showFooter = true,
  contentClassName,
}: InnerPageLayoutProps) {
  const isAdminLayout = isAdminRoute(activePath)
  const [{ user, isAdmin }, siteCopy, adminCtx] = await Promise.all([
    getServerUserAdminFlag(),
    getSiteCopy(),
    isAdminLayout ? getAdminContext() : Promise.resolve(null),
  ])

  if (isAdminLayout) {
    if (!adminCtx || !user) redirect(signInHref({ next: activePath }))
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/40 text-foreground">
      <div className="mx-auto grid w-full max-w-[1265px] flex-1 lg:grid-cols-[minmax(0,275px)_minmax(0,600px)_minmax(0,350px)] lg:justify-center">
        <aside
          aria-label={isAdminLayout ? "Admin navigation" : "Site navigation"}
          className="hidden lg:sticky lg:top-0 lg:col-start-1 lg:block lg:self-start lg:px-4 lg:py-3"
        >
          {isAdminLayout && adminCtx && user ? (
            <AdminSidebarNav
              user={user}
              permissions={adminCtx.permissions}
              isFoundingAdmin={adminCtx.isFoundingAdmin}
              activePath={activePath}
            />
          ) : (
            <HomeSidebarNav
              user={user}
              isAdmin={isAdmin}
              activePath={activePath}
              sidebarTagline={siteCopy.sidebarTagline}
            />
          )}
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white pb-20 lg:col-span-2 lg:col-start-2 lg:border-l lg:border-border/70 lg:pb-0">
          <main
            className={cn(
              "w-full flex-1 px-4 py-6 sm:px-5 lg:px-8 lg:py-8",
              isAdminLayout ? contentClassName ?? adminContentClassName : contentClassName,
              (isAdminLayout ? contentClassName ?? adminContentClassName : contentClassName)?.includes("max-w") &&
                "mx-auto",
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

      {isAdminLayout && adminCtx ? (
        <AdminMobileNav
          permissions={adminCtx.permissions}
          isFoundingAdmin={adminCtx.isFoundingAdmin}
        />
      ) : (
        <HomeMobileBottomNav user={user} isAdmin={isAdmin} />
      )}
    </div>
  )
}
