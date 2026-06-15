"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { AdminBulkActionsBar } from "@/components/admin/admin-bulk-actions-bar"
import { AdminEmptyState } from "@/components/admin/admin-empty-state"
import { AdminRowActionsMenu } from "@/components/admin/admin-row-actions-menu"
import { useAdminSelection } from "@/components/admin/use-admin-selection"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { AdminTableShell } from "@/components/admin/admin-table-shell"
import { AdminToolbar } from "@/components/admin/admin-toolbar"
import {
  deleteVolunteerApplicant,
  listVolunteerApplicants,
  reviewVolunteerApplicant,
  type VolunteerApplicantRecord,
} from "@/app/actions/volunteers"
import {
  ACCOUNT_STATUS_LABELS,
  MEMBER_ROLE_LABELS,
  MEMBER_ROLES,
  type AccountStatus,
  type MemberRole,
} from "@/lib/volunteer-types"
import { ApplicationAnswers } from "@/components/admin/application-answers"
import type { FormRegistry } from "@/lib/form-fields"

type AdminVolunteersListProps = {
  initialApplicants: VolunteerApplicantRecord[]
  registry: FormRegistry
  initialFilter: AccountStatus | "all"
}

function statusTone(status: AccountStatus): "warning" | "success" | "neutral" {
  if (status === "pending_review") return "warning"
  if (status === "active") return "success"
  return "neutral"
}

function formatDate(value: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

function applicationSummary(application: VolunteerApplicantRecord["application"]) {
  if (!application) return "—"
  const parts = [application.skills, application.timezone, application.availability].filter(Boolean)
  if (parts.length > 0) return parts.join(" · ")
  if (application.message) return application.message.slice(0, 120)
  return "—"
}

export function AdminVolunteersList({ initialApplicants, initialFilter, registry }: AdminVolunteersListProps) {
  const [applicants, setApplicants] = useState(initialApplicants)
  const [filter, setFilter] = useState<AccountStatus | "all">(initialFilter)
  const [reviewing, setReviewing] = useState<VolunteerApplicantRecord | null>(null)
  const [bulkActivateOpen, setBulkActivateOpen] = useState(false)
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState<VolunteerApplicantRecord | null>(null)
  const [selectedRole, setSelectedRole] = useState<MemberRole>("volunteer") // Helper — default tier
  const [busyId, setBusyId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (filter === "all") return applicants
    return applicants.filter((item) => item.accountStatus === filter)
  }, [applicants, filter])

  const applicantIds = useMemo(() => filtered.map((item) => item.id), [filtered])
  const { selected, toggle, toggleAll, clear, allSelected, someSelected, selectedCount } =
    useAdminSelection(applicantIds)

  const selectedApplicants = useMemo(
    () => filtered.filter((item) => selected.has(item.id)),
    [filtered, selected],
  )

  const pendingSelected = useMemo(
    () => selectedApplicants.filter((item) => item.accountStatus === "pending_review"),
    [selectedApplicants],
  )

  const deletableSelected = useMemo(
    () => selectedApplicants.filter((item) => item.accountStatus !== "active"),
    [selectedApplicants],
  )

  const isBusy = busyId !== null

  const refresh = async (nextFilter: AccountStatus | "all") => {
    const result = await listVolunteerApplicants(
      nextFilter === "all" ? undefined : { status: nextFilter },
    )
    if ("error" in result) {
      toast({ title: "Could not refresh", description: result.error, variant: "destructive" })
      return
    }
    setApplicants(result.applicants)
  }

  const handleFilterChange = async (value: string) => {
    const next = value as AccountStatus | "all"
    setFilter(next)
    await refresh(next)
  }

  const updateLocal = (userId: string, patch: Partial<VolunteerApplicantRecord>) => {
    setApplicants((prev) => prev.map((item) => (item.id === userId ? { ...item, ...patch } : item)))
  }

  const handleReject = async (applicant: VolunteerApplicantRecord) => {
    setBusyId(applicant.id)
    const result = await reviewVolunteerApplicant({ userId: applicant.id, decision: "reject" })
    setBusyId(null)

    if ("error" in result && result.error) {
      toast({ title: "Could not reject", description: result.error, variant: "destructive" })
      return
    }

    updateLocal(applicant.id, {
      accountStatus: "rejected",
      memberRole: null,
      reviewedAt: new Date().toISOString(),
    })
    toast({ title: "Application rejected" })
  }

  const handleDelete = async () => {
    if (!deleting) return
    setBusyId(deleting.id)

    const result = await deleteVolunteerApplicant({ userId: deleting.id })
    setBusyId(null)

    if ("error" in result && result.error) {
      toast({ title: "Could not delete", description: result.error, variant: "destructive" })
      return
    }

    setApplicants((prev) => prev.filter((item) => item.id !== deleting.id))
    setDeleting(null)
    toast({ title: "Application removed" })
  }

  const handleActivate = async () => {
    if (!reviewing) return
    setBusyId(reviewing.id)

    const result = await reviewVolunteerApplicant({
      userId: reviewing.id,
      decision: "activate",
      role: selectedRole,
    })

    setBusyId(null)

    if ("error" in result && result.error) {
      toast({ title: "Could not activate", description: result.error, variant: "destructive" })
      return
    }

    updateLocal(reviewing.id, {
      accountStatus: "active",
      memberRole: selectedRole,
      reviewedAt: new Date().toISOString(),
    })
    setReviewing(null)
    toast({
      title: "Volunteer activated",
      description: `${reviewing.email} is now ${MEMBER_ROLE_LABELS[selectedRole]}.`,
    })
  }

  const runBulk = async (
    label: string,
    items: VolunteerApplicantRecord[],
    fn: (applicant: VolunteerApplicantRecord) => Promise<{ error?: string } | { success?: boolean }>,
  ) => {
    if (items.length === 0) return
    setBusyId("bulk")
    let failures = 0

    for (const applicant of items) {
      const result = await fn(applicant)
      if ("error" in result && result.error) failures += 1
    }

    setBusyId(null)
    clear()

    if (failures > 0) {
      toast({
        title: `${label} completed with errors`,
        description: `${failures} of ${items.length} applications could not be updated.`,
        variant: "destructive",
      })
    } else {
      toast({ title: `${label} completed`, description: `${items.length} application(s) updated.` })
    }
  }

  const handleBulkActivate = async () => {
    if (pendingSelected.length === 0) {
      toast({
        title: "Nothing to activate",
        description: "No pending applications in selection.",
      })
      return
    }

    setBusyId("bulk")
    let failures = 0

    for (const applicant of pendingSelected) {
      const result = await reviewVolunteerApplicant({
        userId: applicant.id,
        decision: "activate",
        role: selectedRole,
      })

      if ("error" in result && result.error) {
        failures += 1
      } else {
        updateLocal(applicant.id, {
          accountStatus: "active",
          memberRole: selectedRole,
          reviewedAt: new Date().toISOString(),
        })
      }
    }

    setBusyId(null)
    setBulkActivateOpen(false)
    clear()

    if (failures > 0) {
      toast({
        title: "Activate completed with errors",
        description: `${failures} of ${pendingSelected.length} applications could not be activated.`,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Volunteers activated",
        description: `${pendingSelected.length} application(s) set as ${MEMBER_ROLE_LABELS[selectedRole]}.`,
      })
    }
  }

  const handleBulkReject = async () => {
    if (pendingSelected.length === 0) {
      toast({
        title: "Nothing to reject",
        description: "No pending applications in selection.",
      })
      setBulkRejectOpen(false)
      return
    }

    const now = new Date().toISOString()
    await runBulk("Reject", pendingSelected, async (applicant) => {
      const result = await reviewVolunteerApplicant({ userId: applicant.id, decision: "reject" })
      if (!("error" in result && result.error)) {
        updateLocal(applicant.id, {
          accountStatus: "rejected",
          memberRole: null,
          reviewedAt: now,
        })
      }
      return result
    })
    setBulkRejectOpen(false)
  }

  const handleBulkDelete = async () => {
    if (deletableSelected.length === 0) {
      toast({
        title: "Nothing to delete",
        description: "Activated volunteers cannot be deleted here. Manage them from Users instead.",
        variant: "destructive",
      })
      setBulkDeleteOpen(false)
      return
    }

    await runBulk("Delete", deletableSelected, async (applicant) => {
      const result = await deleteVolunteerApplicant({ userId: applicant.id })
      if (!("error" in result && result.error)) {
        setApplicants((prev) => prev.filter((item) => item.id !== applicant.id))
      }
      return result
    })
    setBulkDeleteOpen(false)
  }

  return (
    <>
      <AdminToolbar
        count={`${filtered.length} application${filtered.length === 1 ? "" : "s"}`}
      >
        <Select value={filter} onValueChange={handleFilterChange}>
          <SelectTrigger className="h-9 w-full sm:w-[200px]" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending_review">{ACCOUNT_STATUS_LABELS.pending_review}</SelectItem>
            <SelectItem value="active">{ACCOUNT_STATUS_LABELS.active}</SelectItem>
            <SelectItem value="rejected">{ACCOUNT_STATUS_LABELS.rejected}</SelectItem>
          </SelectContent>
        </Select>
      </AdminToolbar>

      {filtered.length === 0 ? (
        <AdminEmptyState
          title="No applications in this view"
          description="Try another status filter or check back when new volunteers apply."
        />
      ) : (
        <>
          <AdminBulkActionsBar
            selectedCount={selectedCount}
            onClear={clear}
            actions={[
              {
                label: "Activate",
                onClick: () => {
                  setSelectedRole("volunteer")
                  setBulkActivateOpen(true)
                },
                disabled: isBusy || pendingSelected.length === 0,
              },
              {
                label: "Reject",
                onClick: () => setBulkRejectOpen(true),
                disabled: isBusy || pendingSelected.length === 0,
              },
              {
                label: "Delete",
                onClick: () => setBulkDeleteOpen(true),
                variant: "destructive",
                disabled: isBusy || deletableSelected.length === 0,
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
                    aria-label="Select all applications"
                  />
                </TableHead>
                <TableHead className="py-2">Applicant</TableHead>
                <TableHead className="py-2">Status</TableHead>
                <TableHead className="hidden py-2 md:table-cell">Application</TableHead>
                <TableHead className="hidden py-2 sm:table-cell">Applied</TableHead>
                <TableHead className="w-10 py-2 pr-3 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((applicant) => {
                const isPending = applicant.accountStatus === "pending_review"
                const isBusy = busyId === applicant.id

                return (
                  <TableRow key={applicant.id} className="text-sm">
                    <TableCell className="px-3 py-2">
                      <Checkbox
                        checked={selected.has(applicant.id)}
                        onCheckedChange={() => toggle(applicant.id)}
                        aria-label={`Select ${applicant.email || applicant.id}`}
                        disabled={isBusy}
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <p className="truncate font-medium" title={applicant.email || applicant.id}>
                        {applicant.email || applicant.id}
                      </p>
                      {applicant.displayName ? (
                        <p className="truncate text-xs text-muted-foreground">{applicant.displayName}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="py-2">
                      <AdminStatusBadge
                        label={ACCOUNT_STATUS_LABELS[applicant.accountStatus]}
                        tone={statusTone(applicant.accountStatus)}
                      />
                      {applicant.memberRole ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {MEMBER_ROLE_LABELS[applicant.memberRole]}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="hidden max-w-xs py-2 text-muted-foreground md:table-cell">
                      <span className="line-clamp-2">{applicationSummary(applicant.application)}</span>
                    </TableCell>
                    <TableCell className="hidden py-2 text-muted-foreground sm:table-cell">
                      {formatDate(applicant.createdAt)}
                    </TableCell>
                    <TableCell className="py-2 pr-3 text-right">
                      {isPending || applicant.accountStatus === "rejected" ? (
                        <AdminRowActionsMenu
                          disabled={isBusy && busyId !== applicant.id}
                          label={`Actions for ${applicant.email || applicant.id}`}
                          actions={[
                            ...(isPending
                              ? [
                                  {
                                    label: "Activate",
                                    onClick: () => {
                                      setReviewing(applicant)
                                      setSelectedRole("volunteer")
                                    },
                                  },
                                  { label: "Reject", onClick: () => handleReject(applicant) },
                                ]
                              : []),
                            {
                              label: "Delete",
                              onClick: () => setDeleting(applicant),
                              destructive: true,
                              separatorBefore: isPending,
                            },
                          ]}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Reviewed {formatDate(applicant.reviewedAt)}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </AdminTableShell>
        </>
      )}

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove application?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove this application permanently? The account for{" "}
              <span className="font-medium text-foreground">{deleting?.email}</span> will be deleted
              and cannot be recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busyId === deleting?.id}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={busyId === deleting?.id}
              onClick={(event) => {
                event.preventDefault()
                void handleDelete()
              }}
            >
              {busyId === deleting?.id ? "Removing…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={bulkActivateOpen} onOpenChange={setBulkActivateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate {pendingSelected.length} volunteer{pendingSelected.length === 1 ? "" : "s"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Assign the same role to all selected pending applications. Already-active or rejected
              selections are skipped.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="bulk-volunteer-role">Tier</Label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as MemberRole)}>
                <SelectTrigger id="bulk-volunteer-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEMBER_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {MEMBER_ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkActivateOpen(false)} disabled={busyId === "bulk"}>
              Cancel
            </Button>
            <Button onClick={handleBulkActivate} disabled={busyId === "bulk" || pendingSelected.length === 0}>
              {busyId === "bulk" ? "Activating…" : `Activate ${pendingSelected.length}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={bulkRejectOpen} onOpenChange={setBulkRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject {pendingSelected.length} application{pendingSelected.length === 1 ? "" : "s"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Reject the selected pending applications? Applicants will not gain access and can be
              deleted later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busyId === "bulk"}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busyId === "bulk"}
              onClick={(event) => {
                event.preventDefault()
                void handleBulkReject()
              }}
            >
              {busyId === "bulk" ? "Rejecting…" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deletableSelected.length} application{deletableSelected.length === 1 ? "" : "s"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete the selected applications and their accounts? Activated volunteers
              in the selection are skipped. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busyId === "bulk"}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={busyId === "bulk"}
              onClick={(event) => {
                event.preventDefault()
                void handleBulkDelete()
              }}
            >
              {busyId === "bulk" ? "Removing…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!reviewing} onOpenChange={(open) => !open && setReviewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate volunteer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Assign a tier for <span className="font-medium text-foreground">{reviewing?.email}</span>.
              New volunteers default to Helper. Supervisors and Managers gain broader admin access.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="volunteer-role">Tier</Label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as MemberRole)}>
                <SelectTrigger id="volunteer-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEMBER_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {MEMBER_ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {reviewing ? (
              <ApplicationAnswers
                registry={registry}
                answers={reviewing.application?.fields}
                legacy={reviewing.application as Record<string, unknown> | null}
              />
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewing(null)} disabled={busyId === reviewing?.id}>
              Cancel
            </Button>
            <Button onClick={handleActivate} disabled={busyId === reviewing?.id}>
              {busyId === reviewing?.id ? "Activating…" : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
