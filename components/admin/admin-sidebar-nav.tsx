import Link from "next/link"
import { ExternalLink, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { BrandLogo } from "@/components/brand-logo"
import { AuthButton } from "@/components/auth/auth-button"
import {
  getAdminNavLinks,
  isAdminNavLinkActive,
  type AdminNavLink,
} from "@/lib/admin-nav-links"
import type { AdminPermission } from "@/lib/admin-permissions"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface AdminSidebarNavProps {
  user: SupabaseUser
  permissions: AdminPermission[]
  isFoundingAdmin: boolean
  activePath: string
  className?: string
}

function AdminNavItem({
  link,
  active,
}: {
  link: AdminNavLink
  active: boolean
}) {
  const Icon = link.icon

  return (
    <Link
      href={link.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex w-full max-w-full items-center gap-3 rounded-lg px-3 py-2 text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:px-3.5 lg:py-2.5 lg:text-[15px]",
        "hover:bg-muted/50",
        active
          ? "bg-primary/8 font-semibold text-primary"
          : "font-normal text-foreground/80 hover:text-foreground",
      )}
    >
      <Icon className="h-[24px] w-[24px] shrink-0" aria-hidden="true" />
      <span>{link.label}</span>
    </Link>
  )
}

export function AdminSidebarNav({
  user,
  permissions,
  isFoundingAdmin,
  activePath,
  className,
}: AdminSidebarNavProps) {
  const links = getAdminNavLinks(permissions, isFoundingAdmin)

  return (
    <div className={cn("flex flex-col", className)}>
      <div>
        <BrandLogo variant="icon" href="/admin" showWordmark priority className="h-9 w-9 shrink-0" />
        <p className="mt-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Admin
        </p>
      </div>

      <nav aria-label="Admin sections" className="mt-5 space-y-0.5">
        {links.map((link) => (
          <AdminNavItem
            key={link.key}
            link={link}
            active={isAdminNavLinkActive(activePath, link)}
          />
        ))}

        <div className="mt-3 space-y-0.5 border-t border-border/60 pt-3">
          <Link
            href="/"
            className="group flex w-full max-w-full items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-normal text-foreground/70 transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:px-3.5 lg:py-2.5 lg:text-[15px]"
          >
            <Home className="h-[24px] w-[24px] shrink-0" aria-hidden="true" />
            <span>View public site</span>
            <ExternalLink className="ml-auto h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
          </Link>
          <AuthButton user={user} variant="cta" />
        </div>
      </nav>
    </div>
  )
}
