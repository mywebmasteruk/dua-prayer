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

/** Admin sidebar only — public site uses editable `copy.sidebar_tagline` site setting. */
export const ADMIN_SIDEBAR_TAGLINE =
  "Manage duas, channels, users, volunteers, and site settings."

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
    <SidebarNavItem href={link.href} label={link.label} icon={Icon} active={active} />
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
      <SidebarBranding tagline={ADMIN_SIDEBAR_TAGLINE} />

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
