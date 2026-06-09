"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  getAdminNavLinks,
  isAdminNavLinkActive,
  type AdminNavLink,
} from "@/lib/admin-nav-links"
import type { AdminPermission } from "@/lib/admin-permissions"

interface AdminMobileNavProps {
  permissions: AdminPermission[]
  isFoundingAdmin: boolean
}

function MobileAdminNavItem({ link, active }: { link: AdminNavLink; active: boolean }) {
  const Icon = link.icon

  return (
    <Link
      href={link.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "tap-feedback flex shrink-0 flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} aria-hidden="true" />
      <span className="max-w-[4.5rem] truncate">{link.label}</span>
    </Link>
  )
}

export function AdminMobileNav({ permissions, isFoundingAdmin }: AdminMobileNavProps) {
  const pathname = usePathname() ?? "/admin"
  const links = getAdminNavLinks(permissions, isFoundingAdmin)

  if (links.length === 0) return null

  return (
    <nav
      aria-label="Admin sections"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <div className="flex gap-1 overflow-x-auto px-2 py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {links.map((link) => (
          <MobileAdminNavItem
            key={link.key}
            link={link}
            active={isAdminNavLinkActive(pathname, link)}
          />
        ))}
      </div>
    </nav>
  )
}
