"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
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
import { AdminEmptyState } from "@/components/admin/admin-empty-state"
import { AdminRowActionsMenu } from "@/components/admin/admin-row-actions-menu"
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

type AdminVolunteersListProps = {
  initialApplicants: VolunteerApplicantRecord[]
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

export function AdminVolunteersList({ initialApplicants, initialFilter }: AdminVolunteersListProps) {
  const [applicants, setApplicants] = useState(initialApplicants)
  const [filter, setFilter] = useState<AccountStatus | "all">(initialFilter)
  const [reviewing, setReviewing] = useState<VolunteerApplicantRecord | null>(null)
  const [deleting, setDeleting] = useState<VolunteerApplicantRecord | null>(null)
  const [selectedRole, setSelectedRole] = useState<MemberRole>("volunteer")
  const [busyId, setBusyId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (filter === "all") return applicants
    return applicants.filter((item) => item.accountStatus === filter)
  }, [applicants, filter])

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
        <AdminTableShell>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
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
                          disabled={isBusy}
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

      <Dialog open={!!reviewing} onOpenChange={(open) => !open && setReviewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate volunteer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Assign a role for <span className="font-medium text-foreground">{reviewing?.email}</span>.
              Moderator and Admin gain access to admin tools per their role preset.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="volunteer-role">Role</Label>
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
            {reviewing?.application?.message ? (
              <div className="rounded-lg border border-border/70 bg-muted/30 p-3 text-sm">
                <p className="font-medium">Message</p>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                  {reviewing.application.message}
                </p>
              </div>
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
