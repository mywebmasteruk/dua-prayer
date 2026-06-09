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
        "group flex w-full max-w-full items-center gap-3 rounded-full px-3 py-2.5 text-[14px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:px-4 lg:py-3",
        "hover:bg-muted/60 lg:text-[18px]",
        active ? "font-bold text-primary" : "font-normal text-foreground/85",
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
    <div className={cn("flex min-h-[calc(100vh-1.5rem)] flex-col", className)}>
      <div>
        <BrandLogo variant="icon" href="/admin" showWordmark priority className="h-9 w-9 shrink-0" />
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admin</p>
      </div>

      <nav aria-label="Admin sections" className="mt-4 flex-1 space-y-1">
        {links.map((link) => (
          <AdminNavItem
            key={link.key}
            link={link}
            active={isAdminNavLinkActive(activePath, link)}
          />
        ))}
      </nav>

      <div className="mt-6 space-y-1 border-t border-border/70 pt-4">
        <Link
          href="/"
          className="group flex w-full max-w-full items-center gap-3 rounded-full px-3 py-2.5 text-[14px] font-normal text-foreground/70 transition hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:px-4 lg:py-3 lg:text-[16px]"
        >
          <Home className="h-[24px] w-[24px] shrink-0" aria-hidden="true" />
          <span>View public site</span>
          <ExternalLink className="ml-auto h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
        </Link>
        <AuthButton user={user} variant="cta" />
      </div>
    </div>
  )
}
