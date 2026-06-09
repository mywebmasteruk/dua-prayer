"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HandCoins, HandHeart, Home, ShieldAlert, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { signInHref } from "@/lib/auth-modal"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface HomeMobileBottomNavProps {
  user: SupabaseUser | null
  isAdmin?: boolean
}

function BottomNavItem({
  href,
  label,
  icon: Icon,
  active = false,
}: {
  href: string
  label: string
  icon: typeof Home
  active?: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "tap-feedback flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1 text-[10px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <Icon className={cn("h-6 w-6", active && "stroke-[2.5]")} aria-hidden="true" />
      <span className="truncate">{label}</span>
    </Link>
  )
}

export function HomeMobileBottomNav({ user, isAdmin = false }: HomeMobileBottomNavProps) {
  const pathname = usePathname() ?? "/"

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <nav
      aria-label="Mobile primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-1.5">
        <BottomNavItem href="/" label="Home" icon={Home} active={isActive("/")} />
        <BottomNavItem href="/donate" label="Donate" icon={HandCoins} active={isActive("/donate")} />
        <BottomNavItem href="/volunteer" label="Volunteer" icon={HandHeart} active={isActive("/volunteer")} />
        {isAdmin ? (
          <BottomNavItem href="/admin" label="Admin" icon={ShieldAlert} active={isActive("/admin")} />
        ) : (
          <BottomNavItem
            href={signInHref()}
            label={user ? "Account" : "Sign in"}
            icon={User}
            active={false}
          />
        )}
      </div>
    </nav>
  )
}
