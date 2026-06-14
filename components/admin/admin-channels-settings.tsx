"use client"

import { useMemo, useState } from "react"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import {
  createChannel,
  deleteChannel,
  reorderChannels,
  updateChannel,
  type AdminChannelRecord,
} from "@/app/actions/admin-channels"
import { AdminBulkActionsBar } from "@/components/admin/admin-bulk-actions-bar"
import { AdminEmptyState } from "@/components/admin/admin-empty-state"
import { AdminRowActionsMenu } from "@/components/admin/admin-row-actions-menu"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { AdminTableShell } from "@/components/admin/admin-table-shell"
import { useAdminSelection } from "@/components/admin/use-admin-selection"
import { VerifiedChannelBadge } from "@/components/verified-channel-badge"
import {
  CHANNEL_STATUS_LABELS,
  CHANNEL_TYPE_LABELS,
  type ChannelApplicationPayload,
  type ChannelStatus,
  type ChannelType,
} from "@/lib/channel-types"

type AdminChannelsSettingsProps = {
  initialChannels: AdminChannelRecord[]
}

type DraftChannel = {
  name: string
  handle: string
  description: string
  channelType: ChannelType
  status: ChannelStatus
  isActive: boolean
  isVerified: boolean
  applicantName: string
  applicantEmail: string
  organization: string
  website: string
  message: string
  source: string
  sortOrder: number
}

const emptyDraft: DraftChannel = {
  name: "",
  handle: "",
  description: "",
  channelType: "user",
  status: "approved",
  isActive: true,
  isVerified: true,
  applicantName: "",
  applicantEmail: "",
  organization: "",
  website: "",
  message: "",
  source: "manual-admin",
  sortOrder: 0,
}

function toDraft(channel: AdminChannelRecord): DraftChannel {
  return {
    name: channel.name,
    handle: channel.handle ?? channel.application?.handle ?? "",
    description: channel.description,
    channelType: channel.channel_type,
    status: channel.status,
    isActive: channel.is_active,
    isVerified: channel.is_verified,
    applicantName: channel.application?.applicantName ?? "",
    applicantEmail: channel.application?.applicantEmail ?? "",
    organization: channel.application?.organization ?? "",
    website: channel.application?.website ?? "",
    message: channel.application?.message ?? "",
    source: channel.application?.source ?? "manual-admin",
    sortOrder: channel.sort_order,
  }
}

function truncateText(text: string, max = 60) {
  if (text.length <= max) return text
  return `${text.slice(0, max).trim()}…`
}

function SubmittedApplicationDetails({ application }: { application: ChannelApplicationPayload | null }) {
  if (!application) return null

  const rows: Array<{ label: string; value: string }> = []
  const add = (label: string, value: string | undefined) => {
    if (value && value.trim()) rows.push({ label, value: value.trim() })
  }

  add("Channel type", application.channelType)
  add("Applicant role", application.role)
  add("Location", application.location)
  add("Languages", application.languages)
  add("Social media", application.socialMediaLink)
  add("Registration no.", application.registrationNumber)
  if (application.agreedToTerms !== undefined) {
    rows.push({ label: "Agreed to terms", value: application.agreedToTerms ? "Yes" : "No" })
  }
  add("Submission ID", application.filloutSubmissionId)

  if (rows.length === 0) return null

  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
      <p className="text-sm font-medium">Submitted application details</p>
      <dl className="grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col">
            <dt className="text-xs text-muted-foreground">{row.label}</dt>
            <dd className="break-words">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

type ChannelDraftFormProps = {
  draft: DraftChannel
  onChange: (draft: DraftChannel) => void
  mode: "add" | "edit"
}

function ChannelDraftForm({ draft, onChange, mode }: ChannelDraftFormProps) {
  return (
    <div className="space-y-4 py-2">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${mode}-channel-name`}>Organization / channel name</Label>
          <Input
            id={`${mode}-channel-name`}
            value={draft.name}
            onChange={(event) => onChange({ ...draft, name: event.target.value })}
            placeholder="e.g. Masjid Al-Noor"
            required
            autoFocus={mode === "add"}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${mode}-channel-handle`}>Handle / slug</Label>
          <Input
            id={`${mode}-channel-handle`}
            value={draft.handle}
            onChange={(event) => onChange({ ...draft, handle: event.target.value })}
            placeholder="alnoor"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${mode}-channel-description`}>Description / mission</Label>
        <Textarea
          id={`${mode}-channel-description`}
          value={draft.description}
          onChange={(event) => onChange({ ...draft, description: event.target.value })}
          rows={3}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${mode}-channel-type`}>Channel type</Label>
          <select
            id={`${mode}-channel-type`}
            value={draft.channelType}
            onChange={(event) => onChange({ ...draft, channelType: event.target.value as ChannelType })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="user">{CHANNEL_TYPE_LABELS.user}</option>
            <option value="category">{CHANNEL_TYPE_LABELS.category}</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${mode}-channel-status`}>Review status</Label>
          <select
            id={`${mode}-channel-status`}
            value={draft.status}
            onChange={(event) => {
              const status = event.target.value as ChannelStatus
              onChange({
                ...draft,
                status,
                isActive: status === "approved" ? draft.isActive : false,
                isVerified: status === "approved" ? draft.isVerified : false,
              })
            }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="approved">{CHANNEL_STATUS_LABELS.approved}</option>
            <option value="pending_review">{CHANNEL_STATUS_LABELS.pending_review}</option>
            <option value="rejected">{CHANNEL_STATUS_LABELS.rejected}</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${mode}-contact-name`}>Contact name</Label>
          <Input
            id={`${mode}-contact-name`}
            value={draft.applicantName}
            onChange={(event) => onChange({ ...draft, applicantName: event.target.value })}
            placeholder="Imam Yusuf"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${mode}-contact-email`}>Contact email</Label>
          <Input
            id={`${mode}-contact-email`}
            type="email"
            value={draft.applicantEmail}
            onChange={(event) => onChange({ ...draft, applicantEmail: event.target.value })}
            placeholder="imam@example.org"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${mode}-organization`}>Organization / masjid</Label>
          <Input
            id={`${mode}-organization`}
            value={draft.organization}
            onChange={(event) => onChange({ ...draft, organization: event.target.value })}
            placeholder="Masjid Al-Noor"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${mode}-website`}>Website / social link</Label>
          <Input
            id={`${mode}-website`}
            value={draft.website}
            onChange={(event) => onChange({ ...draft, website: event.target.value })}
            placeholder="https://example.org"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${mode}-message`}>Why / notes</Label>
        <Textarea
          id={`${mode}-message`}
          value={draft.message}
          onChange={(event) => onChange({ ...draft, message: event.target.value })}
          rows={3}
          placeholder="Additional context from the application."
        />
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 px-3 py-2.5">
        <div>
          <p className="text-sm font-medium">Active</p>
          <p className="text-xs text-muted-foreground">Inactive channels are hidden from the public feed.</p>
        </div>
        <Switch checked={draft.isActive} onCheckedChange={(checked) => onChange({ ...draft, isActive: checked })} />
      </div>
      <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 px-3 py-2.5">
        <div>
          <p className="text-sm font-medium">Verified</p>
          <p className="text-xs text-muted-foreground">Verified approved channels show the badge.</p>
        </div>
        <Switch
          checked={draft.isVerified}
          onCheckedChange={(checked) => onChange({ ...draft, isVerified: checked })}
        />
      </div>
    </div>
  )
}

export function AdminChannelsSettings({ initialChannels }: AdminChannelsSettingsProps) {
  const [channels, setChannels] = useState(initialChannels)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newDraft, setNewDraft] = useState<DraftChannel>(emptyDraft)
  const [savingId, setSavingId] = useState<number | "new" | "reorder" | "bulk" | null>(null)
  const [editingChannel, setEditingChannel] = useState<AdminChannelRecord | null>(null)
  const [editDraft, setEditDraft] = useState<DraftChannel | null>(null)

  const resetAddForm = () => {
    setNewDraft(emptyDraft)
  }

  const closeAddDialog = () => {
    setAddDialogOpen(false)
    resetAddForm()
  }

  const orderedChannels = useMemo(
    () => [...channels].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
    [channels],
  )

  const channelIds = useMemo(() => orderedChannels.map((channel) => channel.id), [orderedChannels])
  const { selected, toggle, toggleAll, clear, allSelected, someSelected, selectedCount } =
    useAdminSelection(channelIds)

  const selectedChannels = useMemo(
    () => orderedChannels.filter((channel) => selected.has(channel.id)),
    [orderedChannels, selected],
  )

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    setSavingId("new")
    const result = await createChannel(newDraft)
    setSavingId(null)

    if ("error" in result && result.error) {
      toast({ title: "Could not create channel", description: result.error, variant: "destructive" })
      return
    }

    toast({ title: "Channel created" })
    closeAddDialog()
    window.location.reload()
  }

  const openEditDialog = (channel: AdminChannelRecord) => {
    setEditingChannel(channel)
    setEditDraft(toDraft(channel))
  }

  const handleSaveEdit = async () => {
    if (!editingChannel || !editDraft) return

    setSavingId(editingChannel.id)
    const result = await updateChannel({ id: editingChannel.id, ...editDraft })
    setSavingId(null)

    if ("error" in result && result.error) {
      toast({ title: "Could not save channel", description: result.error, variant: "destructive" })
      return
    }

    setChannels((prev) =>
      prev.map((item) =>
        item.id === editingChannel.id
          ? {
              ...item,
              name: editDraft.name,
              description: editDraft.description,
              handle: editDraft.handle || null,
              channel_type: editDraft.channelType,
              status: editDraft.status,
              is_active: editDraft.isActive,
              is_verified: editDraft.isVerified,
              sort_order: editDraft.sortOrder,
              application: {
                ...item.application,
                name: editDraft.name,
                description: editDraft.description,
                handle: editDraft.handle || undefined,
                applicantName: editDraft.applicantName || undefined,
                applicantEmail: editDraft.applicantEmail || undefined,
                organization: editDraft.organization || undefined,
                website: editDraft.website || undefined,
                message: editDraft.message || undefined,
                source: editDraft.source || undefined,
              },
            }
          : item,
      ),
    )
    setEditingChannel(null)
    setEditDraft(null)
    toast({ title: "Channel saved" })
  }

  const handleDelete = async (channel: AdminChannelRecord) => {
    if (channel.duaCount > 0) {
      toast({
        title: "Cannot delete channel",
        description: "This channel has duas attached. Deactivate it instead.",
        variant: "destructive",
      })
      return
    }

    if (!confirm(`Delete channel "${channel.name}"?`)) return

    setSavingId(channel.id)
    const result = await deleteChannel(channel.id)
    setSavingId(null)

    if ("error" in result && result.error) {
      toast({ title: "Could not delete channel", description: result.error, variant: "destructive" })
      return
    }

    setChannels((prev) => prev.filter((item) => item.id !== channel.id))
    toast({ title: "Channel deleted" })
  }

  const setChannelActive = async (channel: AdminChannelRecord, isActive: boolean) => {
    if (channel.is_active === isActive) return

    setSavingId(channel.id)
    const result = await updateChannel({ id: channel.id, isActive })
    setSavingId(null)

    if ("error" in result && result.error) {
      toast({ title: "Could not update channel", description: result.error, variant: "destructive" })
      return
    }

    setChannels((prev) =>
      prev.map((item) => (item.id === channel.id ? { ...item, is_active: isActive } : item)),
    )
    toast({ title: isActive ? "Channel activated" : "Channel deactivated" })
  }

  const moveChannel = async (channelId: number, direction: "up" | "down") => {
    const ids = orderedChannels.map((c) => c.id)
    const index = ids.indexOf(channelId)
    if (index === -1) return
    const swapIndex = direction === "up" ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= ids.length) return

    const nextIds = [...ids]
    ;[nextIds[index], nextIds[swapIndex]] = [nextIds[swapIndex], nextIds[index]]

    setSavingId("reorder")
    const result = await reorderChannels(nextIds)
    setSavingId(null)

    if ("error" in result && result.error) {
      toast({ title: "Could not reorder channels", description: result.error, variant: "destructive" })
      return
    }

    setChannels((prev) =>
      prev.map((channel) => {
        const newIndex = nextIds.indexOf(channel.id)
        return newIndex === -1 ? channel : { ...channel, sort_order: (newIndex + 1) * 10 }
      }),
    )
  }

  const runBulk = async (label: string, fn: (channel: AdminChannelRecord) => Promise<{ error?: string } | { success?: boolean }>) => {
    if (selectedChannels.length === 0) return
    setSavingId("bulk")
    let failures = 0

    for (const channel of selectedChannels) {
      const result = await fn(channel)
      if ("error" in result && result.error) failures += 1
    }

    setSavingId(null)
    clear()

    if (failures > 0) {
      toast({
        title: `${label} completed with errors`,
        description: `${failures} of ${selectedChannels.length} channels could not be updated.`,
        variant: "destructive",
      })
    } else {
      toast({ title: `${label} completed`, description: `${selectedChannels.length} channel(s) updated.` })
    }
  }

  const bulkActivate = async () => {
    await runBulk("Activate", async (channel) => {
      if (channel.is_active) return { success: true }
      const result = await updateChannel({ id: channel.id, isActive: true })
      if (!result.error) {
        setChannels((prev) => prev.map((item) => (item.id === channel.id ? { ...item, is_active: true } : item)))
      }
      return result
    })
  }

  const bulkDeactivate = async () => {
    await runBulk("Deactivate", async (channel) => {
      if (!channel.is_active) return { success: true }
      const result = await updateChannel({ id: channel.id, isActive: false })
      if (!result.error) {
        setChannels((prev) => prev.map((item) => (item.id === channel.id ? { ...item, is_active: false } : item)))
      }
      return result
    })
  }

  const bulkDelete = async () => {
    const deletable = selectedChannels.filter((channel) => channel.duaCount === 0)
    if (deletable.length === 0) {
      toast({
        title: "Nothing to delete",
        description: "Selected channels have duas attached. Deactivate them instead.",
        variant: "destructive",
      })
      return
    }
    if (!confirm(`Delete ${deletable.length} channel(s)?`)) return

    setSavingId("bulk")
    let failures = 0

    for (const channel of deletable) {
      const result = await deleteChannel(channel.id)
      if (result.error) failures += 1
      else setChannels((prev) => prev.filter((item) => item.id !== channel.id))
    }

    setSavingId(null)
    clear()

    if (failures > 0) {
      toast({ title: "Delete completed with errors", variant: "destructive" })
    } else {
      toast({ title: "Channels deleted" })
    }
  }

  const isBusy = savingId !== null

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Approved channels</h2>
            <span className="text-xs font-medium text-muted-foreground">{orderedChannels.length} total</span>
          </div>
          <Button type="button" size="sm" onClick={() => setAddDialogOpen(true)} disabled={isBusy}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add channel
          </Button>
        </div>

        {orderedChannels.length === 0 ? (
          <AdminEmptyState
            title="No channels yet"
            description="Create a channel to organize duas on the home feed and channel browser."
            action={
              <Button type="button" size="sm" onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add channel
              </Button>
            }
          />
        ) : (
          <>
            <AdminBulkActionsBar
              selectedCount={selectedCount}
              onClear={clear}
              actions={[
                { label: "Activate", onClick: bulkActivate, disabled: isBusy },
                { label: "Deactivate", onClick: bulkDeactivate, disabled: isBusy },
                {
                  label: "Delete",
                  onClick: bulkDelete,
                  variant: "destructive",
                  disabled: isBusy || !selectedChannels.some((channel) => channel.duaCount === 0),
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
                        aria-label="Select all channels"
                      />
                    </TableHead>
                    <TableHead className="py-2">Name</TableHead>
                    <TableHead className="hidden py-2 md:table-cell">Description</TableHead>
                    <TableHead className="hidden py-2 lg:table-cell">Type</TableHead>
                    <TableHead className="py-2">Status</TableHead>
                    <TableHead className="hidden py-2 sm:table-cell">Duas</TableHead>
                    <TableHead className="hidden py-2 lg:table-cell">Order</TableHead>
                    <TableHead className="w-10 py-2 pr-3 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderedChannels.map((channel, index) => (
                    <TableRow key={channel.id} className="text-sm">
                      <TableCell className="px-3 py-2">
                        <Checkbox
                          checked={selected.has(channel.id)}
                          onCheckedChange={() => toggle(channel.id)}
                          aria-label={`Select ${channel.name}`}
                        />
                      </TableCell>
                      <TableCell className="py-2 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span>{channel.name}</span>
                          {channel.is_verified && channel.status === "approved" ? (
                            <VerifiedChannelBadge className="h-3.5 w-3.5" />
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="hidden max-w-[220px] py-2 text-muted-foreground md:table-cell">
                        <span className="truncate" title={channel.description}>
                          {truncateText(channel.description)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden py-2 text-muted-foreground lg:table-cell">
                        {CHANNEL_TYPE_LABELS[channel.channel_type]}
                      </TableCell>
                      <TableCell className="py-2">
                        <AdminStatusBadge
                          label={channel.is_active ? "Active" : "Inactive"}
                          tone={channel.is_active ? "success" : "warning"}
                        />
                      </TableCell>
                      <TableCell className="hidden py-2 text-muted-foreground sm:table-cell">{channel.duaCount}</TableCell>
                      <TableCell className="hidden py-2 text-muted-foreground lg:table-cell">{channel.sort_order}</TableCell>
                      <TableCell className="py-2 pr-3 text-right">
                        <AdminRowActionsMenu
                          disabled={isBusy}
                          label={`Actions for ${channel.name}`}
                          actions={[
                            { label: "Edit", onClick: () => openEditDialog(channel) },
                            {
                              label: channel.is_active ? "Deactivate" : "Activate",
                              onClick: () => setChannelActive(channel, !channel.is_active),
                            },
                            {
                              label: "Move up",
                              onClick: () => moveChannel(channel.id, "up"),
                              disabled: index === 0 || savingId === "reorder",
                            },
                            {
                              label: "Move down",
                              onClick: () => moveChannel(channel.id, "down"),
                              disabled: index === orderedChannels.length - 1 || savingId === "reorder",
                            },
                            {
                              label: "Delete",
                              onClick: () => handleDelete(channel),
                              destructive: true,
                              disabled: channel.duaCount > 0,
                              separatorBefore: true,
                            },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AdminTableShell>
          </>
        )}
      </section>

      <Dialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          if (open) setAddDialogOpen(true)
          else closeAddDialog()
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add channel</DialogTitle>
          </DialogHeader>
          <form id="add-channel-form" onSubmit={handleCreate}>
            <ChannelDraftForm draft={newDraft} onChange={setNewDraft} mode="add" />
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeAddDialog} disabled={savingId === "new"}>
              Cancel
            </Button>
            <Button type="submit" form="add-channel-form" disabled={savingId === "new"}>
              {savingId === "new" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Creating…
                </>
              ) : (
                "Create channel"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingChannel}
        onOpenChange={(open) => {
          if (!open) {
            setEditingChannel(null)
            setEditDraft(null)
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit channel</DialogTitle>
          </DialogHeader>
          {editDraft ? <ChannelDraftForm draft={editDraft} onChange={setEditDraft} mode="edit" /> : null}
          {editingChannel ? <SubmittedApplicationDetails application={editingChannel.application} /> : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingChannel(null)
                setEditDraft(null)
              }}
              disabled={savingId === editingChannel?.id}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={savingId === editingChannel?.id}>
              {savingId === editingChannel?.id ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
