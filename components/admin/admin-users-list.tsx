"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import {
  deleteUser,
  deleteUsers,
  setUserRole,
  updateUserDisplayName,
  type AppUserRecord,
} from "@/app/actions/admin-users"
import { AdminBulkActionsBar } from "@/components/admin/admin-bulk-actions-bar"
import { AdminEmptyState } from "@/components/admin/admin-empty-state"
import { AdminRowActionsMenu } from "@/components/admin/admin-row-actions-menu"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { AdminTableShell } from "@/components/admin/admin-table-shell"
import { AdminToolbar } from "@/components/admin/admin-toolbar"
import { useAdminSelection } from "@/components/admin/use-admin-selection"
import { FilterPill } from "@/components/feed-filters"
import { useNavigationRouter } from "@/hooks/use-navigation-router"
import {
  isAdminUser,
  isChannelAdminUser,
  isVolunteerUser,
  matchesUserTypeFilter,
  parseUserTypeFilter,
  USER_TYPE_FILTER_LABELS,
  USER_TYPE_FILTERS,
  userTypeBadges,
  type UserTypeFilter,
} from "@/lib/user-types"

type AdminUsersListProps = {
  users: AppUserRecord[]
  currentUserId: string
  initialTypeFilter?: UserTypeFilter
  /** Whether the current admin may grant/revoke admin roles (founder-only via manage_admins). */
  canManageRoles?: boolean
}

const TYPE_FILTER_OPTIONS: Array<{ id: UserTypeFilter; label: string }> = [
  { id: "all", label: "All" },
  ...USER_TYPE_FILTERS.filter((id) => id !== "all").map((id) => ({
    id,
    label: USER_TYPE_FILTER_LABELS[id],
  })),
]

function formatJoinedDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

export function AdminUsersList({
  users: initialUsers,
  currentUserId,
  initialTypeFilter = "all",
  canManageRoles = false,
}: AdminUsersListProps) {
  const router = useNavigationRouter()
  const searchParams = useSearchParams()
  const [users, setUsers] = useState(initialUsers)
  const [typeFilter, setTypeFilter] = useState<UserTypeFilter>(initialTypeFilter)
  const [editingUser, setEditingUser] = useState<AppUserRecord | null>(null)
  const [deletingUser, setDeletingUser] = useState<AppUserRecord | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("user")
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    setTypeFilter(parseUserTypeFilter(searchParams.get("type")))
  }, [searchParams])

  const handleTypeFilterChange = useCallback(
    (next: UserTypeFilter) => {
      setTypeFilter(next)
      const params = new URLSearchParams(searchParams.toString())
      if (next === "all") {
        params.delete("type")
      } else {
        params.set("type", next)
      }
      const query = params.toString()
      router.push(query ? `/admin/users?${query}` : "/admin/users")
    },
    [router, searchParams],
  )

  const typeCounts = useMemo(() => {
    const counts: Record<UserTypeFilter, number> = {
      all: users.length,
      admin: 0,
      volunteer: 0,
      user: 0,
      channel_admin: 0,
    }
    for (const user of users) {
      if (isAdminUser(user)) counts.admin += 1
      if (isVolunteerUser(user)) counts.volunteer += 1
      if (isChannelAdminUser(user)) counts.channel_admin += 1
      if (matchesUserTypeFilter(user, "user")) counts.user += 1
    }
    return counts
  }, [users])

  const filteredUsers = useMemo(
    () => users.filter((user) => matchesUserTypeFilter(user, typeFilter)),
    [users, typeFilter],
  )

  const canDeleteUser = (user: AppUserRecord) => !user.isFoundingAdmin && user.id !== currentUserId

  const selectableUsers = useMemo(
    () => filteredUsers.filter((user) => !user.isFoundingAdmin && user.id !== currentUserId),
    [filteredUsers, currentUserId],
  )
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

    if (canManageRoles && !editingUser.isFoundingAdmin) {
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

  const handleDeleteUser = async () => {
    if (!deletingUser) return

    setSavingId(deletingUser.id)
    const result = await deleteUser(deletingUser.id)
    setSavingId(null)

    if ("error" in result && result.error) {
      toast({ title: "Could not delete user", description: result.error, variant: "destructive" })
      return
    }

    setUsers((prev) => prev.filter((item) => item.id !== deletingUser.id))
    setDeletingUser(null)
    clear()
    toast({ title: "User deleted", description: "The account has been permanently removed." })
  }

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return

    setSavingId("bulk")
    const result = await deleteUsers(selectedUsers.map((user) => user.id))
    setSavingId(null)
    setBulkDeleteOpen(false)

    if ("error" in result) {
      toast({ title: "Could not delete users", description: result.error, variant: "destructive" })
      return
    }

    const removedIds = new Set(result.deletedIds)
    setUsers((prev) => prev.filter((item) => !removedIds.has(item.id)))
    clear()

    const failureCount = result.failureCount ?? 0
    if (failureCount > 0) {
      toast({
        title: "Delete completed with errors",
        description: `${result.deletedCount} deleted, ${failureCount} could not be removed.`,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Users deleted",
        description: `${result.deletedCount} account(s) permanently removed.`,
      })
    }
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
    return (
      <AdminEmptyState
        title="No users yet"
        description="Community accounts will appear here once people sign up."
      />
    )
  }

  const filterToolbar = (
    <AdminToolbar
      count={`${filteredUsers.length} user${filteredUsers.length === 1 ? "" : "s"}`}
      className="mb-4"
    >
      <div
        className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
        role="tablist"
        aria-label="Filter users by type"
      >
        {TYPE_FILTER_OPTIONS.map((option) => (
          <FilterPill
            key={option.id}
            label={
              typeCounts[option.id] > 0
                ? `${option.label} (${typeCounts[option.id]})`
                : option.label
            }
            isActive={typeFilter === option.id}
            onSelect={() => handleTypeFilterChange(option.id)}
          />
        ))}
      </div>
    </AdminToolbar>
  )

  if (filteredUsers.length === 0) {
    return (
      <>
        {filterToolbar}
        <AdminEmptyState
          title="No users in this view"
          description={
            typeFilter === "channel_admin"
              ? "No users currently own an approved community channel."
              : typeFilter === "volunteer"
                ? "No approved volunteers with active accounts. Pending applicants are under Admin → Volunteers."
                : "Try another type filter."
          }
        />
      </>
    )
  }

  return (
    <>
      {filterToolbar}

      <AdminBulkActionsBar
        selectedCount={selectedCount}
        onClear={clear}
        actions={[
          ...(canManageRoles
            ? [
                { label: "Set as User", onClick: () => runBulkRole("user", "Demote to User"), disabled: isBusy },
                { label: "Set as Moderator", onClick: () => runBulkRole("moderator", "Promote to Moderator"), disabled: isBusy },
                { label: "Set as Admin", onClick: () => runBulkRole("admin", "Promote to Admin"), disabled: isBusy },
              ]
            : []),
          {
            label: "Delete",
            onClick: () => setBulkDeleteOpen(true),
            variant: "destructive",
            disabled: isBusy,
          },
        ]}
      />

      <AdminTableShell>
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
              <TableHead className="py-2">Type</TableHead>
              <TableHead className="hidden py-2 sm:table-cell">Joined</TableHead>
              <TableHead className="hidden py-2 md:table-cell">Duas</TableHead>
              <TableHead className="w-10 py-2 pr-3 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => {
              const canEdit = !user.isFoundingAdmin
              const canDelete = canDeleteUser(user)
              const currentRole = user.isAdmin ? (user.adminRole ?? "admin") : "user"

              return (
                <TableRow key={user.id} className="text-sm">
                  <TableCell className="px-3 py-2">
                    <Checkbox
                      checked={selected.has(user.id)}
                      onCheckedChange={() => toggle(user.id)}
                      disabled={!canDelete}
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
                    <div className="flex flex-wrap gap-1">
                      {userTypeBadges(user).map((badge) => (
                        <AdminStatusBadge key={badge.label} label={badge.label} tone={badge.tone} />
                      ))}
                    </div>
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
                          ...(canManageRoles && currentRole !== "user"
                            ? [{ label: "Demote to User", onClick: () => applyRole(user, "user").then((r) => {
                                if ("error" in r && r.error) toast({ title: "Could not update role", description: r.error, variant: "destructive" })
                                else toast({ title: "User demoted" })
                              }) }]
                            : []),
                          ...(canManageRoles && currentRole !== "moderator"
                            ? [{ label: "Set as Moderator", onClick: () => applyRole(user, "moderator").then((r) => {
                                if ("error" in r && r.error) toast({ title: "Could not update role", description: r.error, variant: "destructive" })
                                else toast({ title: "Role updated" })
                              }) }]
                            : []),
                          ...(canManageRoles && currentRole !== "admin"
                            ? [{ label: "Set as Admin", onClick: () => applyRole(user, "admin").then((r) => {
                                if ("error" in r && r.error) toast({ title: "Could not update role", description: r.error, variant: "destructive" })
                                else toast({ title: "Role updated" })
                              }) }]
                            : []),
                          ...(canDelete
                            ? [
                                {
                                  label: "Delete",
                                  onClick: () => setDeletingUser(user),
                                  destructive: true,
                                  separatorBefore: true,
                                },
                              ]
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
      </AdminTableShell>

      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete the account for{" "}
              <span className="font-medium text-foreground">{deletingUser?.email || deletingUser?.id}</span>?
              Their profile will be removed and their duas will no longer be linked to this account. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={savingId === deletingUser?.id}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={savingId === deletingUser?.id}
              onClick={(event) => {
                event.preventDefault()
                void handleDeleteUser()
              }}
            >
              {savingId === deletingUser?.id ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} user(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete {selectedCount} selected account(s)? Profiles will be removed and duas will no longer
              be linked to those accounts. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={savingId === "bulk"}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={savingId === "bulk"}
              onClick={(event) => {
                event.preventDefault()
                void handleBulkDelete()
              }}
            >
              {savingId === "bulk" ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            {canManageRoles ? (
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
            ) : null}
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
