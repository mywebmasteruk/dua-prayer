import { Bell, Bookmark, BookOpen, HandCoins, HandHeart, Home, Info, LayoutGrid, Shield, ShieldAlert, User, UserCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { getUserNavState } from "@/lib/user-nav"
import { AccountDock } from "./auth/account-dock"
import { isSidebarPathActive, SidebarBranding, SidebarNavItem } from "./sidebar-nav-shared"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface HomeSidebarNavProps {
  user: SupabaseUser | null
  isAdmin?: boolean
  activePath?: string
  showLogo?: boolean
  className?: string
  sidebarTagline?: string
}

export function HomeSidebarNav({
  user,
  isAdmin = false,
  activePath = "/",
  showLogo = true,
  className,
  sidebarTagline = "Share your duas, pray for one another, and grow together in faith.",
}: HomeSidebarNavProps) {
  const navState = getUserNavState(user?.email, isAdmin)
  const accountLabel =
    (typeof user?.user_metadata?.display_name === "string" && user.user_metadata.display_name) ||
    (typeof user?.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
    navState.signedInSummary?.label ||
    "DuaPrayer member"

  return (
    <div className={cn("flex h-full min-h-0 max-h-full flex-col", className)}>
      {showLogo ? <SidebarBranding tagline={sidebarTagline} /> : null}

      <nav aria-label="Primary" className={cn("min-h-0 flex-1 space-y-1 overflow-y-auto pr-1", showLogo && "mt-4")}>
        <SidebarNavItem href="/" label="Home" icon={Home} active={isSidebarPathActive(activePath, "/")} />
        <SidebarNavItem
          href="/channels"
          label="Channels"
          icon={LayoutGrid}
          active={isSidebarPathActive(activePath, "/channels")}
        />
        <SidebarNavItem
          href="/resources"
          label="Resources"
          icon={BookOpen}
          active={isSidebarPathActive(activePath, "/resources")}
        />
        <SidebarNavItem href="/about" label="About" icon={Info} active={isSidebarPathActive(activePath, "/about")} />
        <SidebarNavItem
          href="/donate"
          label="Donate"
          icon={HandCoins}
          active={isSidebarPathActive(activePath, "/donate")}
        />
        <SidebarNavItem
          href="/volunteer"
          label="Volunteer"
          icon={HandHeart}
          active={isSidebarPathActive(activePath, "/volunteer")}
        />
        <SidebarNavItem
          href="/safety"
          label="Safety"
          icon={Shield}
          active={isSidebarPathActive(activePath, "/safety")}
        />
        {navState.guestAccountItem ? (
          <SidebarNavItem
            href={navState.guestAccountItem.href}
            label={navState.guestAccountItem.label}
            icon={UserCheck}
            variant={navState.guestAccountItem.variant}
          />
        ) : null}
        {navState.signedInItems.map((item) => {
          const Icon = item.label === "Profile" ? User : item.label === "Bookmarks" ? Bookmark : Bell
          return (
            <SidebarNavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={Icon}
              active={activePath === item.activePath || isSidebarPathActive(activePath, item.activePath)}
            />
          )
        })}
        {navState.showAdminLink ? (
          <SidebarNavItem
            href="/admin"
            label="Admin"
            icon={ShieldAlert}
            active={isSidebarPathActive(activePath, "/admin")}
          />
        ) : null}
      </nav>

      {navState.signedInSummary ? (
        <div className="shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-3">
          <AccountDock label={accountLabel} email={user?.email} />
        </div>
      ) : null}
    </div>
  )
}
