/**
 * Horizontal admin tab bar — replaced by AdminSidebarNav in the left sidebar.
 * Kept for import stability; renders nothing.
 */
import type { AdminPermission } from "@/lib/admin-permissions"
import type { AdminNavKey } from "@/lib/admin-nav-links"

type AdminNavProps = {
  permissions: AdminPermission[]
  isFoundingAdmin: boolean
  active: AdminNavKey
}

export function AdminNav(_props: AdminNavProps) {
  return null
}
