import type { LucideIcon } from "lucide-react"
import { BookOpen, HandHeart, LayoutGrid, Plug, Settings2, Type, Users } from "lucide-react"
import type { AdminPermission } from "@/lib/admin-permissions"

export type AdminNavKey =
  | "dashboard"
  | "channels"
  | "users"
  | "volunteers"
  | "settings"
  | "copy"
  | "integration"

export type AdminNavLink = {
  key: AdminNavKey
  href: string
  label: string
  icon: LucideIcon
  visible: boolean
}

function canSee(permissions: AdminPermission[], isFoundingAdmin: boolean, required: AdminPermission) {
  return isFoundingAdmin || permissions.includes(required)
}

export function getAdminNavLinks(
  permissions: AdminPermission[],
  isFoundingAdmin: boolean,
): AdminNavLink[] {
  const links: AdminNavLink[] = [
    {
      key: "dashboard",
      href: "/admin",
      label: "Duas",
      icon: BookOpen,
      visible: canSee(permissions, isFoundingAdmin, "manage_duas"),
    },
    {
      key: "channels",
      href: "/admin/channels",
      label: "Channels",
      icon: LayoutGrid,
      visible: canSee(permissions, isFoundingAdmin, "manage_channels"),
    },
    {
      key: "users",
      href: "/admin/users",
      label: "Users",
      icon: Users,
      visible: canSee(permissions, isFoundingAdmin, "manage_users"),
    },
    {
      key: "volunteers",
      href: "/admin/volunteers",
      label: "Volunteers",
      icon: HandHeart,
      visible: canSee(permissions, isFoundingAdmin, "manage_volunteers"),
    },
    {
      key: "settings",
      href: "/admin/settings",
      label: "Settings",
      icon: Settings2,
      visible:
        canSee(permissions, isFoundingAdmin, "manage_settings") ||
        canSee(permissions, isFoundingAdmin, "manage_admins"),
    },
    {
      key: "copy",
      href: "/admin/copy",
      label: "Site copy",
      icon: Type,
      visible: canSee(permissions, isFoundingAdmin, "manage_settings"),
    },
    {
      key: "integration",
      href: "/admin/integration",
      label: "Integration",
      icon: Plug,
      visible:
        canSee(permissions, isFoundingAdmin, "manage_settings") ||
        canSee(permissions, isFoundingAdmin, "manage_volunteers"),
    },
  ]

  return links.filter((link) => link.visible)
}

export function isAdminNavLinkActive(activePath: string, link: AdminNavLink): boolean {
  if (link.key === "dashboard") return activePath === "/admin"
  if (link.key === "settings") return activePath === "/admin/settings"
  if (link.key === "integration") {
    return activePath === "/admin/integration" || activePath === "/admin/settings/stripe"
  }
  return activePath === link.href || activePath.startsWith(`${link.href}/`)
}
