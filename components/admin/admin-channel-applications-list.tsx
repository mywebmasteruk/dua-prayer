"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import {
  listChannelApplications,
  reviewChannelApplication,
  type ChannelApplicationRecord,
} from "@/app/actions/channel-applications"
import { AdminBulkActionsBar } from "@/components/admin/admin-bulk-actions-bar"
import { AdminEmptyState } from "@/components/admin/admin-empty-state"
import { AdminRowActionsMenu } from "@/components/admin/admin-row-actions-menu"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { AdminTableShell } from "@/components/admin/admin-table-shell"
import { AdminToolbar } from "@/components/admin/admin-toolbar"
import { useAdminSelection } from "@/components/admin/use-admin-selection"
import { VerifiedChannelBadge } from "@/components/verified-channel-badge"
import { CHANNEL_STATUS_LABELS, type ChannelStatus } from "@/lib/channel-types"
import { getChannelHandle } from "@/lib/channels"
import { ApplicationAnswers } from "@/components/admin/application-answers"
import type { FormRegistry } from "@/lib/form-fields"

type AdminChannelApplicationsListProps = {
  initialApplications: ChannelApplicationRecord[]
  initialFilter: ChannelStatus | "all"
  registry: FormRegistry
}

function statusTone(status: ChannelStatus): "warning" | "success" | "neutral" {
  if (status === "pending_review") return "warning"
  if (status === "approved") return "success"
  return "neutral"
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

function applicationSummary(application: ChannelApplicationRecord) {
  const parts = [application.description]
  if (application.handle) parts.unshift(`@${getChannelHandle(application)}`)
  return parts.filter(Boolean).join(" · ").slice(0, 140)
}

export function AdminChannelApplicationsList({
  initialApplications,
  initialFilter,
  registry,
}: AdminChannelApplicationsListProps) {
  const [applications, setApplications] = useState(initialApplications)
  const [filter, setFilter] = useState<ChannelStatus | "all">(initialFilter)
  const [busyId, setBusyId] = useState<number | "bulk" | null>(null)
  const [bulkApproveOpen, setBulkApproveOpen] = useState(false)
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false)
  const [detailApp, setDetailApp] = useState<ChannelApplicationRecord | null>(null)

  const filtered = useMemo(() => {
    if (filter === "all") return applications
    return applications.filter((item) => item.status === filter)
  }, [applications, filter])

  const applicationIds = useMemo(() => filtered.map((item) => item.id), [filtered])
  const { selected, toggle, toggleAll, clear, allSelected, someSelected, selectedCount } =
    useAdminSelection(applicationIds)

  const selectedApplications = useMemo(
    () => filtered.filter((item) => selected.has(item.id)),
    [filtered, selected],
  )

  const pendingSelected = useMemo(
    () => selectedApplications.filter((item) => item.status === "pending_review"),
    [selectedApplications],
  )

  const isBusy = busyId !== null

  const refresh = async (nextFilter: ChannelStatus | "all") => {
    const result = await listChannelApplications(nextFilter === "all" ? undefined : { status: nextFilter })
    if ("applications" in result) setApplications(result.applications)
  }

  const handleFilterChange = async (value: ChannelStatus | "all") => {
    setFilter(value)
    clear()
    await refresh(value)
  }

  const updateLocal = (channelId: number, patch: Partial<ChannelApplicationRecord>) => {
    setApplications((prev) => prev.map((item) => (item.id === channelId ? { ...item, ...patch } : item)))
  }

  const handleReview = async (application: ChannelApplicationRecord, decision: "approve" | "reject") => {
    setBusyId(application.id)
    const result = await reviewChannelApplication({ channelId: application.id, decision })
    setBusyId(null)

    if ("error" in result && result.error) {
      toast({ title: "Could not update application", description: result.error, variant: "destructive" })
      return
    }

    updateLocal(application.id, {
      status: decision === "approve" ? "approved" : "rejected",
      is_active: decision === "approve",
      is_verified: decision === "approve",
      reviewed_at: new Date().toISOString(),
    })

    toast({
      title: decision === "approve" ? "Channel approved" : "Application rejected",
      description:
        decision === "approve"
          ? `${application.name} is now live with a verified badge.`
          : `${application.name} was rejected and stays hidden from the public list.`,
    })
  }

  const runBulk = async (
    label: string,
    items: ChannelApplicationRecord[],
    decision: "approve" | "reject",
  ) => {
    if (items.length === 0) return
    setBusyId("bulk")
    let failures = 0

    for (const application of items) {
      const result = await reviewChannelApplication({ channelId: application.id, decision })
      if ("error" in result && result.error) failures += 1
      else {
        updateLocal(application.id, {
          status: decision === "approve" ? "approved" : "rejected",
          is_active: decision === "approve",
          is_verified: decision === "approve",
          reviewed_at: new Date().toISOString(),
        })
      }
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

  return (
    <>
      <AdminToolbar count={`${filtered.length} application${filtered.length === 1 ? "" : "s"}`}>
        <Select value={filter} onValueChange={(value) => handleFilterChange(value as ChannelStatus | "all")}>
          <SelectTrigger className="h-9 w-full sm:w-[200px]" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending_review">{CHANNEL_STATUS_LABELS.pending_review}</SelectItem>
            <SelectItem value="approved">{CHANNEL_STATUS_LABELS.approved}</SelectItem>
            <SelectItem value="rejected">{CHANNEL_STATUS_LABELS.rejected}</SelectItem>
          </SelectContent>
        </Select>
      </AdminToolbar>

      {filtered.length === 0 ? (
        <AdminEmptyState
          title="No applications in this view"
          description="New community channel applications will appear here for review."
        />
      ) : (
        <>
          <AdminBulkActionsBar
            selectedCount={selectedCount}
            onClear={clear}
            actions={[
              {
                label: "Approve",
                onClick: () => setBulkApproveOpen(true),
                disabled: isBusy || pendingSelected.length === 0,
              },
              {
                label: "Reject",
                onClick: () => setBulkRejectOpen(true),
                disabled: isBusy || pendingSelected.length === 0,
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
                  <TableHead className="py-2">Channel</TableHead>
                  <TableHead className="py-2">Applicant</TableHead>
                  <TableHead className="py-2">Status</TableHead>
                  <TableHead className="hidden py-2 md:table-cell">Summary</TableHead>
                  <TableHead className="hidden py-2 sm:table-cell">Applied</TableHead>
                  <TableHead className="w-10 py-2 pr-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((application) => {
                  const isPending = application.status === "pending_review"
                  const rowBusy = busyId === application.id

                  return (
                    <TableRow key={application.id} className="text-sm">
                      <TableCell className="px-3 py-2">
                        <Checkbox
                          checked={selected.has(application.id)}
                          onCheckedChange={() => toggle(application.id)}
                          aria-label={`Select ${application.name}`}
                        />
                      </TableCell>
                      <TableCell className="py-2 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span>{application.name}</span>
                          {application.is_verified && application.status === "approved" ? (
                            <VerifiedChannelBadge className="h-3.5 w-3.5" />
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                          @{getChannelHandle(application)}
                        </p>
                      </TableCell>
                      <TableCell className="py-2">
                        <div>{application.applicantName || "—"}</div>
                        {application.applicantEmail ? (
                          <Link
                            href={`mailto:${application.applicantEmail}`}
                            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                          >
                            {application.applicantEmail}
                          </Link>
                        ) : null}
                      </TableCell>
                      <TableCell className="py-2">
                        <AdminStatusBadge
                          label={CHANNEL_STATUS_LABELS[application.status]}
                          tone={statusTone(application.status)}
                        />
                      </TableCell>
                      <TableCell className="hidden max-w-[240px] py-2 text-muted-foreground md:table-cell">
                        {applicationSummary(application)}
                      </TableCell>
                      <TableCell className="hidden py-2 text-muted-foreground sm:table-cell">
                        {formatDate(application.created_at)}
                      </TableCell>
                      <TableCell className="py-2 pr-3 text-right">
                        <AdminRowActionsMenu
                          disabled={isBusy}
                          label={`Actions for ${application.name}`}
                          actions={[
                            {
                              label: "View details",
                              onClick: () => setDetailApp(application),
                            },
                            {
                              label: "Approve",
                              onClick: () => handleReview(application, "approve"),
                              disabled: !isPending || rowBusy,
                            },
                            {
                              label: "Reject",
                              onClick: () => handleReview(application, "reject"),
                              disabled: !isPending || rowBusy,
                            },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </AdminTableShell>
        </>
      )}

      <Dialog open={!!detailApp} onOpenChange={(open) => !open && setDetailApp(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailApp?.name}</DialogTitle>
            <DialogDescription>
              {detailApp?.applicantEmail || detailApp?.applicantName || "Application details"}
            </DialogDescription>
          </DialogHeader>
          {detailApp ? (
            <ApplicationAnswers
              registry={registry}
              answers={detailApp.application?.fields}
              legacy={detailApp.application as Record<string, unknown> | null}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={bulkApproveOpen} onOpenChange={setBulkApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve selected channels?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingSelected.length} community channel
              {pendingSelected.length === 1 ? "" : "s"} will go live on /channels with a verified badge.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isBusy}
              onClick={async (event) => {
                event.preventDefault()
                await runBulk("Approve", pendingSelected, "approve")
                setBulkApproveOpen(false)
              }}
            >
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkRejectOpen} onOpenChange={setBulkRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject selected applications?</AlertDialogTitle>
            <AlertDialogDescription>
              Rejected channels stay hidden from the public channel browser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isBusy}
              onClick={async (event) => {
                event.preventDefault()
                await runBulk("Reject", pendingSelected, "reject")
                setBulkRejectOpen(false)
              }}
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
