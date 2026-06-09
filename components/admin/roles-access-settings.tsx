"use client"

import { useState } from "react"
import { Loader2, Trash2 } from "lucide-react"
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
  ADMIN_ROLE_LABELS,
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

  return (
    <div className="space-y-5">
      {currentUser && (
        <AdminSection title="Your access">
          <dl className="space-y-2.5 text-sm">
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-muted-foreground">Signed in as</dt>
              <dd className="font-medium">{currentUser.email}</dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-muted-foreground">Role</dt>
              <dd className="font-medium">
                {currentUser.isFoundingAdmin
                  ? SUPER_ADMIN_ROLE_LABEL
                  : currentUser.role
                    ? ADMIN_ROLE_LABELS[currentUser.role]
                    : "Admin"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Permissions</dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {currentUser.permissions.map((permission) => (
                  <span
                    key={permission}
                    className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground"
                  >
                    {PERMISSION_LABELS[permission]}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </AdminSection>
      )}

      <AdminSection title="Role presets">
        <ul className="space-y-3 text-sm text-muted-foreground">
          {(Object.keys(ROLE_PERMISSIONS) as AdminRoleType[]).map((roleKey) => (
            <li key={roleKey}>
              <span className="font-medium text-foreground">{ADMIN_ROLE_LABELS[roleKey]}</span>
              {" — "}
              {ROLE_PERMISSIONS[roleKey].map((p) => PERMISSION_LABELS[p]).join(", ")}
            </li>
          ))}
          <li>
            <span className="font-medium text-foreground">{SUPER_ADMIN_ROLE_LABEL}</span>
            {" — "}
            All permissions via SUPER_ADMIN_EMAIL (not assignable)
          </li>
        </ul>
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
                  {(Object.keys(ADMIN_ROLE_LABELS) as AdminRoleType[]).map((roleKey) => (
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
          Only the founding admin can invite or change other admins. You can view your own permissions above.
        </p>
      )}
    </div>
  )
}
