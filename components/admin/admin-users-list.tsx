"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
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
import { ADMIN_ROLE_LABELS, USER_ROLE_LABEL, type AdminRoleType } from "@/lib/admin-permissions"
import { setUserRole, updateUserDisplayName, type AppUserRecord } from "@/app/actions/admin-users"

type AdminUsersListProps = {
  users: AppUserRecord[]
}

export function AdminUsersList({ users }: AdminUsersListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [roleById, setRoleById] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  const startEdit = (user: AppUserRecord) => {
    setEditingId(user.id)
    setDisplayName(user.displayName ?? "")
    setRoleById((prev) => ({
      ...prev,
      [user.id]: user.isAdmin ? (user.adminRole ?? "admin") : "user",
    }))
  }

  const handleSave = async (user: AppUserRecord) => {
    setSavingId(user.id)

    if (displayName.trim() && displayName.trim() !== (user.displayName ?? "")) {
      const nameResult = await updateUserDisplayName(user.id, displayName)
      if ("error" in nameResult && nameResult.error) {
        setSavingId(null)
        toast({ title: "Could not update name", description: nameResult.error, variant: "destructive" })
        return
      }
    }

    const selectedRole = roleById[user.id] ?? (user.isAdmin ? user.adminRole ?? "admin" : "user")
    const currentRole = user.isAdmin ? (user.adminRole ?? "admin") : "user"
    if (selectedRole !== currentRole && !user.isFoundingAdmin) {
      const roleResult = await setUserRole({
        userId: user.id,
        role: selectedRole as "user" | AdminRoleType,
      })
      if ("error" in roleResult && roleResult.error) {
        setSavingId(null)
        toast({ title: "Could not update role", description: roleResult.error, variant: "destructive" })
        return
      }
    }

    setSavingId(null)
    setEditingId(null)
    toast({ title: "User updated" })
  }

  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground">No users found yet.</p>
  }

  return (
    <ul className="divide-y divide-border/60">
      {users.map((user) => {
        const isEditing = editingId === user.id
        const selectedRole = roleById[user.id] ?? (user.isAdmin ? user.adminRole ?? "admin" : "user")

        return (
          <li key={user.id} className="py-4 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{user.email || user.id}</p>
                <p className="text-sm text-muted-foreground">
                  {user.roleLabel} · {user.duaCount} dua{user.duaCount === 1 ? "" : "s"}
                </p>
                {!isEditing && user.displayName ? (
                  <p className="mt-1 text-sm text-muted-foreground">Display name: {user.displayName}</p>
                ) : null}
              </div>
              {!user.isFoundingAdmin && (
                <Button type="button" variant="outline" size="sm" onClick={() => (isEditing ? setEditingId(null) : startEdit(user))}>
                  {isEditing ? "Cancel" : "Edit"}
                </Button>
              )}
            </div>

            {isEditing && (
              <div className="mt-4 space-y-4 rounded-xl border border-border/70 bg-muted/30 p-4">
                <div className="space-y-2">
                  <Label htmlFor={`display-name-${user.id}`}>Display name</Label>
                  <Input
                    id={`display-name-${user.id}`}
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`role-${user.id}`}>Role</Label>
                  <Select value={selectedRole} onValueChange={(value) => setRoleById((prev) => ({ ...prev, [user.id]: value }))}>
                    <SelectTrigger id={`role-${user.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">{USER_ROLE_LABEL}</SelectItem>
                      {(Object.keys(ADMIN_ROLE_LABELS) as AdminRoleType[]).map((roleKey) => (
                        <SelectItem key={roleKey} value={roleKey}>
                          {ADMIN_ROLE_LABELS[roleKey]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" size="sm" disabled={savingId === user.id} onClick={() => handleSave(user)}>
                  {savingId === user.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Saving…
                    </>
                  ) : (
                    "Save changes"
                  )}
                </Button>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
