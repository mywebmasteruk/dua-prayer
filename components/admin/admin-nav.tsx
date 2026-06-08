import Link from "next/link"
import { cn } from "@/lib/utils"
import type { AdminPermission } from "@/lib/admin-permissions"

type AdminNavProps = {
  permissions: AdminPermission[]
  isFoundingAdmin: boolean
  active: "dashboard" | "settings" | "roles"
}

function canSee(permissions: AdminPermission[], isFoundingAdmin: boolean, required: AdminPermission) {
  return isFoundingAdmin || permissions.includes(required)
}

export function AdminNav({ permissions, isFoundingAdmin, active }: AdminNavProps) {
  const links = [
    {
      key: "dashboard" as const,
      href: "/admin",
      label: "Duas",
      visible: canSee(permissions, isFoundingAdmin, "manage_duas"),
    },
    {
      key: "settings" as const,
      href: "/admin/settings",
      label: "Settings",
      visible:
        canSee(permissions, isFoundingAdmin, "manage_settings") ||
        canSee(permissions, isFoundingAdmin, "manage_volunteers"),
    },
    {
      key: "roles" as const,
      href: "/admin/settings/roles",
      label: "Roles & Access",
      visible: isFoundingAdmin || canSee(permissions, isFoundingAdmin, "manage_admins"),
    },
  ].filter((link) => link.visible)

  if (links.length <= 1) return null

  return (
    <nav aria-label="Admin sections" className="mb-6 flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.key}
          href={link.href}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-medium transition",
            active === link.key
              ? "border-primary bg-primary/10 text-primary"
              : "border-border/70 text-muted-foreground hover:border-border hover:text-foreground",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
