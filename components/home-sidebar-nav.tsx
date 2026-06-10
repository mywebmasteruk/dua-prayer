import { BookOpen, HandCoins, HandHeart, Home, Info, LayoutGrid, Shield, ShieldAlert, UserCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { getUserNavState } from "@/lib/user-nav"
import { AuthButton } from "./auth/auth-button"
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
  activePath = "/",
  showLogo = true,
  className,
  sidebarTagline = "Share your duas, pray for one another, and grow together in faith.",
}: HomeSidebarNavProps) {
  const navState = getUserNavState(user?.email)

  return (
    <div className={cn("flex flex-col", className)}>
      {showLogo ? <SidebarBranding tagline={sidebarTagline} /> : null}

      <nav aria-label="Primary" className={cn("space-y-1", showLogo && "mt-4")}>
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
        {navState.signedInSummary ? (
          <div className="rounded-3xl border border-border/60 bg-white/55 px-3 py-3 shadow-sm lg:px-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {navState.signedInSummary.eyebrow}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-foreground" title={navState.signedInSummary.label}>
              {navState.signedInSummary.label}
            </p>
          </div>
        ) : null}
        {navState.signedInItems.map((item) => (
          <SidebarNavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={UserCheck}
            active={activePath === item.activePath || isSidebarPathActive(activePath, item.activePath)}
          />
        ))}
        {navState.showAdminLink ? (
          <SidebarNavItem
            href="/admin"
            label="Admin"
            icon={ShieldAlert}
            active={isSidebarPathActive(activePath, "/admin")}
          />
        ) : null}
        {user ? <AuthButton user={user} variant="cta" /> : null}
      </nav>
    </div>
  )
}
