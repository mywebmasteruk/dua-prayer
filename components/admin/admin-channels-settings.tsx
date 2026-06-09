"use client"

import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import {
  createChannel,
  deleteChannel,
  reorderChannels,
  updateChannel,
  type AdminChannelRecord,
} from "@/app/actions/admin-channels"

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

export function AdminChannelsSettings({ initialChannels }: AdminChannelsSettingsProps) {
  const [channels, setChannels] = useState(initialChannels)
  const [drafts, setDrafts] = useState<Record<number, DraftChannel>>(() =>
    Object.fromEntries(initialChannels.map((c) => [c.id, toDraft(c)])),
  )
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [savingId, setSavingId] = useState<number | "new" | "reorder" | null>(null)

  const orderedChannels = useMemo(
    () => [...channels].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
    [channels],
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

  const handleSave = async (channel: AdminChannelRecord) => {
    const draft = drafts[channel.id]
    if (!draft) return

    setSavingId(channel.id)
    const result = await updateChannel({
      id: channel.id,
      name: draft.name,
      description: draft.description,
      isActive: draft.isActive,
      sortOrder: draft.sortOrder,
    })
    setSavingId(null)

    if ("error" in result && result.error) {
      toast({ title: "Could not save channel", description: result.error, variant: "destructive" })
      return
    }

    setChannels((prev) =>
      prev.map((item) =>
        item.id === channel.id
          ? { ...item, ...draft, name: draft.name, description: draft.description, is_active: draft.isActive, sort_order: draft.sortOrder }
          : item,
      ),
    )
    toast({ title: "Channel saved" })
  }

  const handleDelete = async (channel: AdminChannelRecord) => {
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
    setDrafts((prev) => {
      const next = { ...prev }
      for (const [id, draft] of Object.entries(next)) {
        const newIndex = nextIds.indexOf(Number(id))
        if (newIndex !== -1) next[Number(id)] = { ...draft, sortOrder: (newIndex + 1) * 10 }
      }
      return next
    })
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Add channel</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Channels group duas on the home feed and channel browser.
        </p>
        <form onSubmit={handleCreate} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-channel-name">Name</Label>
            <Input
              id="new-channel-name"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="e.g. Ramadan"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-channel-description">Description</Label>
            <Textarea
              id="new-channel-description"
              value={newDescription}
              onChange={(event) => setNewDescription(event.target.value)}
              rows={3}
              required
            />
          </div>
          <Button type="submit" disabled={savingId === "new"}>
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
        </form>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Channels</h2>
        {orderedChannels.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No channels yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border/60">
            {orderedChannels.map((channel, index) => {
              const draft = drafts[channel.id] ?? toDraft(channel)
              return (
                <li key={channel.id} className="py-5 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                      {channel.duaCount} dua{channel.duaCount === 1 ? "" : "s"} · order {draft.sortOrder}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={index === 0 || savingId === "reorder"}
                        onClick={() => moveChannel(channel.id, "up")}
                        aria-label={`Move ${channel.name} up`}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={index === orderedChannels.length - 1 || savingId === "reorder"}
                        onClick={() => moveChannel(channel.id, "down")}
                        aria-label={`Move ${channel.name} down`}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`channel-name-${channel.id}`}>Name</Label>
                      <Input
                        id={`channel-name-${channel.id}`}
                        value={draft.name}
                        onChange={(event) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [channel.id]: { ...draft, name: event.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`channel-description-${channel.id}`}>Description</Label>
                      <Textarea
                        id={`channel-description-${channel.id}`}
                        value={draft.description}
                        onChange={(event) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [channel.id]: { ...draft, description: event.target.value },
                          }))
                        }
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">Active</p>
                        <p className="text-xs text-muted-foreground">Inactive channels are hidden from the public feed.</p>
                      </div>
                      <Switch
                        checked={draft.isActive}
                        onCheckedChange={(checked) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [channel.id]: { ...draft, isActive: checked },
                          }))
                        }
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" disabled={savingId === channel.id} onClick={() => handleSave(channel)}>
                        {savingId === channel.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            Saving…
                          </>
                        ) : (
                          "Save"
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={savingId === channel.id || channel.duaCount > 0}
                        onClick={() => handleDelete(channel)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
