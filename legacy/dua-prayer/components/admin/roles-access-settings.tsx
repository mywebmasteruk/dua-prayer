"use client"

import { useState } from "react"
import { Loader2, Lock } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import {
  ADMIN_PERMISSIONS,
  ADMIN_ROLE_LABELS,
  PERMISSION_LABELS,
  SUPER_ADMIN_ROLE_LABEL,
  type AdminPermission,
  type AdminRoleType,
} from "@/lib/admin-permissions"
import type { RolePermissionMap } from "@/lib/role-permissions-server"
import { saveRolePermissions } from "@/app/actions/admin-roles"
import { AdminSection } from "@/components/admin/admin-section"
import { cn } from "@/lib/utils"

type RolesAccessSettingsProps = {
  currentUser: {
    email: string
    displayName: string | null
    isFoundingAdmin: boolean
    role: AdminRoleType | null
    permissions: AdminPermission[]
  } | null
  rolePermissions: RolePermissionMap
  canManageAdmins: boolean
}

type RoleKey = AdminRoleType | "super"

const ROLE_OPTIONS: { key: RoleKey; label: string; note: string; editable: boolean }[] = [
  { key: "admin", label: ADMIN_ROLE_LABELS.admin, note: "Assignable", editable: true },
  { key: "moderator", label: ADMIN_ROLE_LABELS.moderator, note: "Assignable", editable: true },
  { key: "volunteer", label: ADMIN_ROLE_LABELS.volunteer, note: "Assigned via Volunteers → Roles", editable: true },
  { key: "super", label: SUPER_ADMIN_ROLE_LABEL, note: "Founder only · all permissions", editable: false },
]

export function RolesAccessSettings({ currentUser, rolePermissions, canManageAdmins }: RolesAccessSettingsProps) {
  const [perms, setPerms] = useState<RolePermissionMap>(rolePermissions)
  const yourRoleKey: RoleKey = currentUser ? (currentUser.isFoundingAdmin ? "super" : currentUser.role ?? "admin") : "admin"
  const [selectedRole, setSelectedRole] = useState<RoleKey>(yourRoleKey)
  const [savingRole, setSavingRole] = useState<AdminRoleType | null>(null)

  const activeOption = ROLE_OPTIONS.find((r) => r.key === selectedRole) ?? ROLE_OPTIONS[0]
  const isSuper = selectedRole === "super"
  const rolePerms: readonly AdminPermission[] = isSuper ? ADMIN_PERMISSIONS : perms[selectedRole as AdminRoleType]
  const grantedCount = isSuper ? ADMIN_PERMISSIONS.length : rolePerms.length

  async function toggle(permission: AdminPermission, checked: boolean) {
    if (isSuper || !canManageAdmins || permission === "manage_admins") return
    const role = selectedRole as AdminRoleType
    const current = perms[role]
    const next = checked ? [...current, permission] : current.filter((p) => p !== permission)
    const ordered = ADMIN_PERMISSIONS.filter((p) => next.includes(p))

    const previous = perms
    setPerms((prev) => ({ ...prev, [role]: ordered }))
    setSavingRole(role)
    const result = await saveRolePermissions({ role, permissions: ordered })
    setSavingRole(null)

    if ("error" in result && result.error) {
      setPerms(previous)
      toast({ title: "Could not update role", description: result.error, variant: "destructive" })
    }
  }

  return (
    <div className="space-y-5">
      {currentUser && (
        <p className="text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{currentUser.email}</span> · Your role{" "}
          <span className="font-medium text-foreground">
            {currentUser.isFoundingAdmin
              ? SUPER_ADMIN_ROLE_LABEL
              : currentUser.role
                ? ADMIN_ROLE_LABELS[currentUser.role]
                : "Admin"}
          </span>
        </p>
      )}

      <AdminSection
        title="Roles & permissions"
        description={
          canManageAdmins
            ? "Select a role, then tick the permissions it should have. Changes apply to everyone with that role."
            : "Select a role to see its permissions."
        }
      >
        <div className="grid gap-4 md:grid-cols-[230px_1fr]">
          <div role="tablist" aria-label="Roles" className="flex flex-col gap-1.5">
            {ROLE_OPTIONS.map((roleOption) => {
              const isActive = roleOption.key === selectedRole
              const isYours = roleOption.key === yourRoleKey
              return (
                <button
                  key={roleOption.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedRole(roleOption.key)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive ? "border-primary bg-primary/5" : "border-border/60 hover:bg-muted/40",
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    {roleOption.label}
                    {isYours ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">You</span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{roleOption.note}</span>
                </button>
              )
            })}
          </div>

          <div className="overflow-hidden rounded-xl border border-border/60">
            <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-3 py-2">
              <span className="text-sm font-semibold text-foreground">{activeOption.label}</span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                {savingRole && savingRole === selectedRole ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : null}
                {grantedCount} of {ADMIN_PERMISSIONS.length} permissions
              </span>
            </div>
            <ul>
              {ADMIN_PERMISSIONS.map((permission) => {
                const isManageAdmins = permission === "manage_admins"
                const checked = isSuper ? true : rolePerms.includes(permission)
                const locked = isSuper || isManageAdmins || !canManageAdmins
                return (
                  <li
                    key={permission}
                    className="flex items-center justify-between gap-3 border-b border-border/50 px-3 py-2.5 last:border-0"
                  >
                    <label htmlFor={`perm-${permission}`} className="flex items-center gap-2 text-sm text-foreground">
                      {PERMISSION_LABELS[permission]}
                      {isManageAdmins && !isSuper ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Lock className="h-3 w-3" aria-hidden="true" /> Founder only
                        </span>
                      ) : null}
                    </label>
                    <Checkbox
                      id={`perm-${permission}`}
                      checked={checked}
                      disabled={locked}
                      onCheckedChange={(value) => toggle(permission, value === true)}
                    />
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        {!canManageAdmins && (
          <p className="mt-3 text-xs text-muted-foreground">
            Only the founding admin or admins with the &ldquo;Manage admins &amp; roles&rdquo; permission can edit roles.
          </p>
        )}
      </AdminSection>
    </div>
  )
}
