import { BookOpen, HandCoins, HandHeart, Home, Info, LayoutGrid, Shield, ShieldAlert, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { signInHref } from "@/lib/auth-modal"
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
  isAdmin = false,
  activePath = "/",
  showLogo = true,
  className,
  sidebarTagline = "Share your duas, pray for one another, and grow together in faith.",
}: HomeSidebarNavProps) {
  const accountHref = signInHref()
  const accountLabel = user ? "Account" : "Sign in"

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
        <SidebarNavItem
          href={accountHref}
          label={accountLabel}
          icon={User}
          variant={user ? "default" : "cta"}
        />
        {isAdmin ? (
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
