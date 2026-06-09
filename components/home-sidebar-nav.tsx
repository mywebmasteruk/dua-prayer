import Link from "next/link"
import { BookOpen, HandCoins, HandHeart, Home, Info, Shield, ShieldAlert, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { BrandLogo } from "./brand-logo"
import { AuthButton } from "./auth/auth-button"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface HomeSidebarNavProps {
  user: SupabaseUser | null
  isAdmin?: boolean
  activePath?: string
  showLogo?: boolean
  className?: string
  sidebarTagline?: string
}

function NavItem({
  href,
  label,
  icon: Icon,
  active = false,
  variant = "default",
}: {
  href: string
  label: string
  icon: typeof Home
  active?: boolean
  variant?: "default" | "cta"
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex w-full max-w-full items-center gap-3 rounded-full px-3 py-3 text-[15px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        variant === "cta"
          ? "justify-center -translate-x-1 gap-2 bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
          : cn(
              "hover:bg-muted/60",
              active ? "font-semibold text-foreground" : "font-medium text-foreground/85",
            ),
      )}
    >
      <Icon className="h-[26px] w-[26px] shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </Link>
  )
}

function isActivePath(activePath: string, href: string) {
  if (href === "/") return activePath === "/"
  return activePath === href || activePath.startsWith(`${href}/`)
}

export function HomeSidebarNav({
  user,
  isAdmin = false,
  activePath = "/",
  showLogo = true,
  className,
  sidebarTagline = "Share duas, support one another, and grow together in faith.",
}: HomeSidebarNavProps) {
  const accountHref = "/auth"
  const accountLabel = user ? "Account" : "Sign in"

  return (
    <div className={cn("flex flex-col", className)}>
      {showLogo ? (
        <div>
          <BrandLogo variant="icon" href="/" showWordmark priority className="h-9 w-9 shrink-0" />
          <p className="mt-2 text-xs leading-snug text-muted-foreground">{sidebarTagline}</p>
        </div>
      ) : null}

      <nav aria-label="Primary" className={cn("space-y-1", showLogo && "mt-4")}>
        <NavItem href="/" label="Home" icon={Home} active={isActivePath(activePath, "/")} />
        <NavItem
          href="/resources"
          label="Resources"
          icon={BookOpen}
          active={isActivePath(activePath, "/resources")}
        />
        <NavItem href="/about" label="About" icon={Info} active={isActivePath(activePath, "/about")} />
        <NavItem href="/donate" label="Donate" icon={HandCoins} active={isActivePath(activePath, "/donate")} />
        <NavItem
          href="/volunteer"
          label="Volunteer"
          icon={HandHeart}
          active={isActivePath(activePath, "/volunteer")}
        />
        <NavItem href="/safety" label="Safety" icon={Shield} active={isActivePath(activePath, "/safety")} />
        <NavItem
          href={accountHref}
          label={accountLabel}
          icon={User}
          active={isActivePath(activePath, "/auth")}
          variant={user ? "default" : "cta"}
        />
        {isAdmin ? (
          <NavItem href="/admin" label="Admin" icon={ShieldAlert} active={isActivePath(activePath, "/admin")} />
        ) : null}
        {user ? (
          <div className="px-3 pt-1">
            <AuthButton user={user} />
          </div>
        ) : null}
      </nav>
    </div>
  )
}
