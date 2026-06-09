import type { LucideIcon } from "lucide-react"
import {
  BookOpen,
  CreditCard,
  HandHeart,
  LayoutGrid,
  Settings2,
  Shield,
  Type,
  Users,
} from "lucide-react"
import type { AdminPermission } from "@/lib/admin-permissions"

export type AdminNavKey =
  | "dashboard"
  | "channels"
  | "users"
  | "volunteers"
  | "settings"
  | "copy"
  | "stripe"
  | "roles"

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
        canSee(permissions, isFoundingAdmin, "manage_volunteers"),
    },
    {
      key: "copy",
      href: "/admin/copy",
      label: "Site copy",
      icon: Type,
      visible: canSee(permissions, isFoundingAdmin, "manage_settings"),
    },
    {
      key: "stripe",
      href: "/admin/settings/stripe",
      label: "Stripe donations",
      icon: CreditCard,
      visible: canSee(permissions, isFoundingAdmin, "manage_settings"),
    },
    {
      key: "roles",
      href: "/admin/settings/roles",
      label: "Roles & Access",
      icon: Shield,
      visible: isFoundingAdmin || canSee(permissions, isFoundingAdmin, "manage_admins"),
    },
  ]

  return links.filter((link) => link.visible)
}

export function isAdminNavLinkActive(activePath: string, link: AdminNavLink): boolean {
  if (link.key === "dashboard") return activePath === "/admin"
  if (link.key === "settings") return activePath === "/admin/settings"
  if (link.key === "stripe") return activePath === "/admin/settings/stripe"
  if (link.key === "roles") return activePath === "/admin/settings/roles"
  return activePath === link.href || activePath.startsWith(`${link.href}/`)
}
