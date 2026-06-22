"use client"

import { useState } from "react"
import { Check, Loader2, Minus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import {
  ADMIN_PERMISSIONS,
  ADMIN_ROLE_LABELS,
  ASSIGNABLE_ADMIN_ROLES,
  PERMISSION_LABELS,
  ROLE_PERMISSIONS,
  SUPER_ADMIN_ROLE_LABEL,
  type AdminPermission,
  type AdminRoleType,
} from "@/lib/admin-permissions"
import {
  assignAdminRole,
  revokeAdminAccess,
  type AdminUserRecord,
} from "@/app/actions/admin-roles"
import { AdminEmptyState } from "@/components/admin/admin-empty-state"
import { AdminSection } from "@/components/admin/admin-section"
import { cn } from "@/lib/utils"

// Roles shown in the matrix. Super Admin is founder-only and holds every
// permission (including manage_admins, which the presets never grant).
type RoleView = { key: string; label: string; note: string; permissions: readonly AdminPermission[] }

const ROLE_VIEWS: RoleView[] = [
  { key: "admin", label: ADMIN_ROLE_LABELS.admin, note: "Assignable", permissions: ROLE_PERMISSIONS.admin },
  { key: "moderator", label: ADMIN_ROLE_LABELS.moderator, note: "Assignable", permissions: ROLE_PERMISSIONS.moderator },
  { key: "volunteer", label: ADMIN_ROLE_LABELS.volunteer, note: "Assigned via Volunteers → Roles", permissions: ROLE_PERMISSIONS.volunteer },
  { key: "super", label: SUPER_ADMIN_ROLE_LABEL, note: "Founder only · not assignable", permissions: ADMIN_PERMISSIONS },
]

type RolesAccessSettingsProps = {
  currentUser: {
    email: string
    displayName: string | null
    isFoundingAdmin: boolean
    role: AdminRoleType | null
    permissions: AdminPermission[]
  } | null
  admins: AdminUserRecord[]
  canManageAdmins: boolean
}

export function RolesAccessSettings({ currentUser, admins, canManageAdmins }: RolesAccessSettingsProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<AdminRoleType>("moderator")
  const [isSaving, setIsSaving] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const handleAssign = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canManageAdmins) return

    setIsSaving(true)
    const result = await assignAdminRole({ email, role })
    setIsSaving(false)

    if ("error" in result && result.error) {
      toast({ title: "Could not assign role", description: result.error, variant: "destructive" })
      return
    }

    toast({ title: "Admin updated", description: `${email} is now a ${ADMIN_ROLE_LABELS[role]}.` })
    setEmail("")
  }

  const handleRevoke = async (admin: AdminUserRecord) => {
    if (!canManageAdmins || admin.isFoundingAdmin) return

    setRevokingId(admin.id)
    const result = await revokeAdminAccess(admin.id)
    setRevokingId(null)

    if ("error" in result && result.error) {
      toast({ title: "Could not revoke access", description: result.error, variant: "destructive" })
      return
    }

    toast({ title: "Access revoked", description: `${admin.email} is no longer an admin.` })
  }

  const yourRoleKey = currentUser ? (currentUser.isFoundingAdmin ? "super" : currentUser.role ?? "admin") : null
  const [selectedRole, setSelectedRole] = useState<string>(yourRoleKey ?? "admin")
  const activeRole = ROLE_VIEWS.find((r) => r.key === selectedRole) ?? ROLE_VIEWS[0]

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

      <AdminSection title="Roles" description="Select a role to see exactly what it can access.">
        <div className="grid gap-4 md:grid-cols-[230px_1fr]">
          <div role="tablist" aria-label="Roles" className="flex flex-col gap-1.5">
            {ROLE_VIEWS.map((roleView) => {
              const isActive = roleView.key === selectedRole
              const isYours = roleView.key === yourRoleKey
              return (
                <button
                  key={roleView.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedRole(roleView.key)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive ? "border-primary bg-primary/5" : "border-border/60 hover:bg-muted/40",
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    {roleView.label}
                    {isYours ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">You</span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{roleView.note}</span>
                </button>
              )
            })}
          </div>

          <div className="overflow-hidden rounded-xl border border-border/60">
            <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-3 py-2">
              <span className="text-sm font-semibold text-foreground">{activeRole.label}</span>
              <span className="text-xs text-muted-foreground">
                {activeRole.permissions.length} of {ADMIN_PERMISSIONS.length} permissions
              </span>
            </div>
            <ul>
              {ADMIN_PERMISSIONS.map((permission) => {
                const allowed = activeRole.permissions.includes(permission)
                return (
                  <li
                    key={permission}
                    className="flex items-center justify-between gap-3 border-b border-border/50 px-3 py-2.5 last:border-0"
                  >
                    <span className={cn("text-sm", allowed ? "text-foreground" : "text-muted-foreground/70")}>
                      {PERMISSION_LABELS[permission]}
                    </span>
                    {allowed ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                        <Check className="h-4 w-4" aria-hidden="true" />
                        Allowed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/50">
                        <Minus className="h-4 w-4" aria-hidden="true" />
                        No access
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </AdminSection>

      {canManageAdmins && (
        <AdminSection
          title="Invite admin"
          description="The person must already have a DuaPrayer account (same email they use to sign in)."
        >
          <form onSubmit={handleAssign} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="teammate@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-role">Role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as AdminRoleType)}>
                <SelectTrigger id="admin-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_ADMIN_ROLES.map((roleKey) => (
                    <SelectItem key={roleKey} value={roleKey}>
                      {ADMIN_ROLE_LABELS[roleKey]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Saving…
                </>
              ) : (
                "Grant admin access"
              )}
            </Button>
          </form>
        </AdminSection>
      )}

      <AdminSection title="Admin team">
        {admins.length === 0 ? (
          <AdminEmptyState title="No admins listed yet" description="Invite a teammate above to grant admin access." />
        ) : (
          <ul className="divide-y divide-border/60">
            {admins.map((admin) => (
              <li key={admin.id} className="flex flex-wrap items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{admin.email || admin.displayName || admin.id}</p>
                  <p className="text-sm text-muted-foreground">
                    {admin.isFoundingAdmin
                      ? "Founding admin"
                      : admin.role
                        ? ADMIN_ROLE_LABELS[admin.role]
                        : "Admin"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {admin.permissions.map((permission) => (
                      <span
                        key={permission}
                        className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {PERMISSION_LABELS[permission]}
                      </span>
                    ))}
                  </div>
                </div>
                {canManageAdmins && !admin.isFoundingAdmin && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={revokingId === admin.id}
                    onClick={() => handleRevoke(admin)}
                    className="shrink-0 text-destructive hover:text-destructive"
                  >
                    {revokingId === admin.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Revoke
                      </>
                    )}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </AdminSection>

      {!canManageAdmins && (
        <p className="text-sm text-muted-foreground">
          Only the founding admin or admins with the &ldquo;Manage admins &amp; roles&rdquo; permission can
          invite or change other admins. You can view role presets and the admin team in read-only mode.
        </p>
      )}
    </div>
  )
}
