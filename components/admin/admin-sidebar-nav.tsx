import { Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { AuthButton } from "@/components/auth/auth-button"
import { SidebarBranding, SidebarNavItem } from "@/components/sidebar-nav-shared"
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
  sidebarTagline: string
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
    <SidebarNavItem href={link.href} label={link.label} icon={Icon} active={active} />
  )
}

export function AdminSidebarNav({
  user,
  permissions,
  isFoundingAdmin,
  activePath,
  sidebarTagline,
  className,
}: AdminSidebarNavProps) {
  const links = getAdminNavLinks(permissions, isFoundingAdmin)

  return (
    <div className={cn("flex flex-col", className)}>
      <SidebarBranding tagline={sidebarTagline} />

      <nav aria-label="Admin sections" className="mt-4 space-y-1">
        {links.map((link) => (
          <AdminNavItem
            key={link.key}
            link={link}
            active={isAdminNavLinkActive(activePath, link)}
          />
        ))}

        <SidebarNavItem href="/" label="View public site" icon={Home} />
        <AuthButton user={user} variant="cta" />
      </nav>
    </div>
  )
}
