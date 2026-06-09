"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { ADMIN_ROLE_LABELS, USER_ROLE_LABEL, type AdminRoleType } from "@/lib/admin-permissions"
import { setUserRole, updateUserDisplayName, type AppUserRecord } from "@/app/actions/admin-users"
import { AdminBulkActionsBar } from "@/components/admin/admin-bulk-actions-bar"
import { AdminRowActionsMenu } from "@/components/admin/admin-row-actions-menu"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { useAdminSelection } from "@/components/admin/use-admin-selection"

type AdminUsersListProps = {
  users: AppUserRecord[]
}

function formatJoinedDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

function roleTone(user: AppUserRecord): "success" | "warning" | "neutral" {
  if (user.isFoundingAdmin) return "success"
  if (user.isAdmin) return "warning"
  return "neutral"
}

export function AdminUsersList({ users: initialUsers }: AdminUsersListProps) {
  const [users, setUsers] = useState(initialUsers)
  const [editingUser, setEditingUser] = useState<AppUserRecord | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("user")
  const [savingId, setSavingId] = useState<string | null>(null)

  const selectableUsers = useMemo(() => users.filter((user) => !user.isFoundingAdmin), [users])
  const selectableIds = useMemo(() => selectableUsers.map((user) => user.id), [selectableUsers])
  const { selected, toggle, toggleAll, clear, allSelected, someSelected, selectedCount } =
    useAdminSelection(selectableIds)

  const selectedUsers = useMemo(
    () => selectableUsers.filter((user) => selected.has(user.id)),
    [selectableUsers, selected],
  )

  const openEditDialog = (user: AppUserRecord) => {
    setEditingUser(user)
    setDisplayName(user.displayName ?? "")
    setSelectedRole(user.isAdmin ? (user.adminRole ?? "admin") : "user")
  }

  const applyRole = async (user: AppUserRecord, role: "user" | AdminRoleType) => {
    const currentRole = user.isAdmin ? (user.adminRole ?? "admin") : "user"
    if (role === currentRole) return { success: true as const }

    const result = await setUserRole({ userId: user.id, role })
    if ("error" in result && result.error) return result

    setUsers((prev) =>
      prev.map((item) =>
        item.id === user.id
          ? {
              ...item,
              isAdmin: role !== "user",
              adminRole: role === "user" ? null : role,
              roleLabel:
                role === "user"
                  ? USER_ROLE_LABEL
                  : ADMIN_ROLE_LABELS[role],
            }
          : item,
      ),
    )
    return { success: true as const }
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return

    setSavingId(editingUser.id)

    if (displayName.trim() && displayName.trim() !== (editingUser.displayName ?? "")) {
      const nameResult = await updateUserDisplayName(editingUser.id, displayName)
      if ("error" in nameResult && nameResult.error) {
        setSavingId(null)
        toast({ title: "Could not update name", description: nameResult.error, variant: "destructive" })
        return
      }
      setUsers((prev) =>
        prev.map((item) => (item.id === editingUser.id ? { ...item, displayName: displayName.trim() } : item)),
      )
    }

    if (!editingUser.isFoundingAdmin) {
      const roleResult = await applyRole(editingUser, selectedRole as "user" | AdminRoleType)
      if ("error" in roleResult && roleResult.error) {
        setSavingId(null)
        toast({ title: "Could not update role", description: roleResult.error, variant: "destructive" })
        return
      }
    }

    setSavingId(null)
    setEditingUser(null)
    toast({ title: "User updated" })
  }

  const runBulkRole = async (role: "user" | AdminRoleType, label: string) => {
    if (selectedUsers.length === 0) return
    setSavingId("bulk")
    let failures = 0

    for (const user of selectedUsers) {
      const result = await applyRole(user, role)
      if ("error" in result && result.error) failures += 1
    }

    setSavingId(null)
    clear()

    if (failures > 0) {
      toast({
        title: `${label} completed with errors`,
        description: `${failures} of ${selectedUsers.length} users could not be updated.`,
        variant: "destructive",
      })
    } else {
      toast({ title: `${label} completed`, description: `${selectedUsers.length} user(s) updated.` })
    }
  }

  const isBusy = savingId !== null

  if (users.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No users found yet.</p>
  }

  return (
    <>
      <AdminBulkActionsBar
        selectedCount={selectedCount}
        onClear={clear}
        actions={[
          { label: "Set as User", onClick: () => runBulkRole("user", "Demote to User"), disabled: isBusy },
          { label: "Set as Moderator", onClick: () => runBulkRole("moderator", "Promote to Moderator"), disabled: isBusy },
          { label: "Set as Admin", onClick: () => runBulkRole("admin", "Promote to Admin"), disabled: isBusy },
        ]}
      />

      <div className="overflow-hidden rounded-lg border border-border/70">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 px-3 py-2">
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={toggleAll}
                  disabled={selectableIds.length === 0}
                  aria-label="Select all users"
                />
              </TableHead>
              <TableHead className="py-2">User</TableHead>
              <TableHead className="py-2">Role</TableHead>
              <TableHead className="hidden py-2 sm:table-cell">Joined</TableHead>
              <TableHead className="hidden py-2 md:table-cell">Duas</TableHead>
              <TableHead className="w-10 py-2 pr-3 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const canEdit = !user.isFoundingAdmin
              const currentRole = user.isAdmin ? (user.adminRole ?? "admin") : "user"

              return (
                <TableRow key={user.id} className="text-sm">
                  <TableCell className="px-3 py-2">
                    <Checkbox
                      checked={selected.has(user.id)}
                      onCheckedChange={() => toggle(user.id)}
                      disabled={!canEdit}
                      aria-label={`Select ${user.email || user.id}`}
                    />
                  </TableCell>
                  <TableCell className="py-2">
                    <p className="truncate font-medium" title={user.email || user.id}>
                      {user.email || user.id}
                    </p>
                    {user.displayName ? (
                      <p className="truncate text-xs text-muted-foreground">{user.displayName}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="py-2">
                    <AdminStatusBadge label={user.roleLabel} tone={roleTone(user)} />
                  </TableCell>
                  <TableCell className="hidden py-2 text-muted-foreground sm:table-cell">
                    {formatJoinedDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="hidden py-2 text-muted-foreground md:table-cell">{user.duaCount}</TableCell>
                  <TableCell className="py-2 pr-3 text-right">
                    {canEdit ? (
                      <AdminRowActionsMenu
                        disabled={isBusy}
                        label={`Actions for ${user.email || user.id}`}
                        actions={[
                          { label: "Edit", onClick: () => openEditDialog(user) },
                          ...(currentRole !== "user"
                            ? [{ label: "Demote to User", onClick: () => applyRole(user, "user").then((r) => {
                                if ("error" in r && r.error) toast({ title: "Could not update role", description: r.error, variant: "destructive" })
                                else toast({ title: "User demoted" })
                              }) }]
                            : []),
                          ...(currentRole !== "moderator"
                            ? [{ label: "Set as Moderator", onClick: () => applyRole(user, "moderator").then((r) => {
                                if ("error" in r && r.error) toast({ title: "Could not update role", description: r.error, variant: "destructive" })
                                else toast({ title: "Role updated" })
                              }) }]
                            : []),
                          ...(currentRole !== "admin"
                            ? [{ label: "Set as Admin", onClick: () => applyRole(user, "admin").then((r) => {
                                if ("error" in r && r.error) toast({ title: "Could not update role", description: r.error, variant: "destructive" })
                                else toast({ title: "Role updated" })
                              }) }]
                            : []),
                        ]}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">Fixed</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-display-name">Display name</Label>
              <Input
                id="edit-display-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-user-role">Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="edit-user-role">
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)} disabled={savingId === editingUser?.id}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={savingId === editingUser?.id}>
              {savingId === editingUser?.id ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
