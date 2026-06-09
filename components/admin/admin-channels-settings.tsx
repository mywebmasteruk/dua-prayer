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
import { AdminRowActionsMenu } from "@/components/admin/admin-row-actions-menu"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { useAdminSelection } from "@/components/admin/use-admin-selection"

type AdminChannelsSettingsProps = {
  initialChannels: AdminChannelRecord[]
}

type DraftChannel = {
  name: string
  description: string
  isActive: boolean
  sortOrder: number
}

function toDraft(channel: AdminChannelRecord): DraftChannel {
  return {
    name: channel.name,
    description: channel.description,
    isActive: channel.is_active,
    sortOrder: channel.sort_order,
  }
}

function truncateText(text: string, max = 60) {
  if (text.length <= max) return text
  return `${text.slice(0, max).trim()}…`
}

export function AdminChannelsSettings({ initialChannels }: AdminChannelsSettingsProps) {
  const [channels, setChannels] = useState(initialChannels)
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [savingId, setSavingId] = useState<number | "new" | "reorder" | "bulk" | null>(null)
  const [editingChannel, setEditingChannel] = useState<AdminChannelRecord | null>(null)
  const [editDraft, setEditDraft] = useState<DraftChannel | null>(null)

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
    const result = await createChannel({ name: newName, description: newDescription, isActive: true })
    setSavingId(null)

    if ("error" in result && result.error) {
      toast({ title: "Could not create channel", description: result.error, variant: "destructive" })
      return
    }

    toast({ title: "Channel created" })
    setNewName("")
    setNewDescription("")
    window.location.reload()
  }

  const openEditDialog = (channel: AdminChannelRecord) => {
    setEditingChannel(channel)
    setEditDraft(toDraft(channel))
  }

  const handleSaveEdit = async () => {
    if (!editingChannel || !editDraft) return

    setSavingId(editingChannel.id)
    const result = await updateChannel({
      id: editingChannel.id,
      name: editDraft.name,
      description: editDraft.description,
      isActive: editDraft.isActive,
      sortOrder: editDraft.sortOrder,
    })
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
              is_active: editDraft.isActive,
              sort_order: editDraft.sortOrder,
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
      <section className="rounded-lg border border-border/70 bg-card p-4 shadow-sm">
        <h2 className="text-base font-semibold tracking-tight">Add channel</h2>
        <p className="mt-1 text-sm text-muted-foreground">Channels group duas on the home feed and channel browser.</p>
        <form onSubmit={handleCreate} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-1">
            <Label htmlFor="new-channel-name">Name</Label>
            <Input
              id="new-channel-name"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="e.g. Ramadan"
              required
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="new-channel-description">Description</Label>
            <Textarea
              id="new-channel-description"
              value={newDescription}
              onChange={(event) => setNewDescription(event.target.value)}
              rows={2}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" size="sm" disabled={savingId === "new"}>
              {savingId === "new" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Creating…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add channel
                </>
              )}
            </Button>
          </div>
        </form>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold tracking-tight">Channels</h2>
          <span className="text-xs text-muted-foreground">{orderedChannels.length} total</span>
        </div>

        {orderedChannels.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No channels yet.</p>
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

            <div className="overflow-hidden rounded-lg border border-border/70">
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
                      <TableCell className="py-2 font-medium">{channel.name}</TableCell>
                      <TableCell className="hidden max-w-[220px] py-2 text-muted-foreground md:table-cell">
                        <span className="truncate" title={channel.description}>
                          {truncateText(channel.description)}
                        </span>
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
            </div>
          </>
        )}
      </section>

      <Dialog
        open={!!editingChannel}
        onOpenChange={(open) => {
          if (!open) {
            setEditingChannel(null)
            setEditDraft(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit channel</DialogTitle>
          </DialogHeader>
          {editDraft ? (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-channel-name">Name</Label>
                <Input
                  id="edit-channel-name"
                  value={editDraft.name}
                  onChange={(event) => setEditDraft({ ...editDraft, name: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-channel-description">Description</Label>
                <Textarea
                  id="edit-channel-description"
                  value={editDraft.description}
                  onChange={(event) => setEditDraft({ ...editDraft, description: event.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">Inactive channels are hidden from the public feed.</p>
                </div>
                <Switch
                  checked={editDraft.isActive}
                  onCheckedChange={(checked) => setEditDraft({ ...editDraft, isActive: checked })}
                />
              </div>
            </div>
          ) : null}
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
