"use client"

import { useMemo, useState } from "react"
import { Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { deleteDua, unflagDua, updateDua, updateDuaStatus } from "@/app/actions/duas"
import type { Category, Dua } from "@/lib/types/dua"
import { AdminBulkActionsBar } from "@/components/admin/admin-bulk-actions-bar"
import { AdminRowActionsMenu } from "@/components/admin/admin-row-actions-menu"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { useAdminSelection } from "@/components/admin/use-admin-selection"

interface AdminDuaListProps {
  initialDuas: Dua[]
  categories: Category[]
}

function truncateText(text: string, max = 80) {
  if (text.length <= max) return text
  return `${text.slice(0, max).trim()}…`
}

export function AdminDuaList({ initialDuas, categories }: AdminDuaListProps) {
  const [duas, setDuas] = useState<Dua[]>(initialDuas)
  const [editingDua, setEditingDua] = useState<Dua | null>(null)
  const [editText, setEditText] = useState("")
  const [editCategory, setEditCategory] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const duaIds = useMemo(() => duas.map((dua) => dua.id), [duas])
  const { selected, toggle, toggleAll, clear, allSelected, someSelected, selectedCount } = useAdminSelection(duaIds)

  const selectedDuas = useMemo(() => duas.filter((dua) => selected.has(dua.id)), [duas, selected])

  const runBulk = async (label: string, fn: (dua: Dua) => Promise<{ error?: string } | { success?: boolean }>) => {
    if (selectedDuas.length === 0) return
    setIsLoading(true)
    let failures = 0

    for (const dua of selectedDuas) {
      const result = await fn(dua)
      if ("error" in result && result.error) failures += 1
    }

    setIsLoading(false)
    clear()

    if (failures > 0) {
      toast({
        title: `${label} completed with errors`,
        description: `${failures} of ${selectedDuas.length} items could not be updated.`,
        variant: "destructive",
      })
    } else {
      toast({ title: `${label} completed`, description: `${selectedDuas.length} dua(s) updated.` })
    }
  }

  const handleTogglePublish = async (dua: Dua, published?: boolean) => {
    const nextPublished = published ?? !dua.published
    setIsLoading(true)
    const result = await updateDuaStatus(dua.id, nextPublished)

    if (result.error) {
      toast({ title: "Error", description: "Failed to update dua status", variant: "destructive" })
    } else {
      setDuas((prev) => prev.map((d) => (d.id === dua.id ? { ...d, published: nextPublished } : d)))
      toast({
        title: "Success",
        description: `Dua ${nextPublished ? "published" : "unpublished"} successfully`,
      })
    }
    setIsLoading(false)
  }

  const handleUnflag = async (dua: Dua) => {
    setIsLoading(true)
    const result = await unflagDua(dua.id)

    if (result.error) {
      toast({ title: "Error", description: "Failed to unflag dua", variant: "destructive" })
    } else {
      setDuas((prev) => prev.map((d) => (d.id === dua.id ? { ...d, flagged: false } : d)))
      toast({ title: "Success", description: "Dua unflagged successfully" })
    }
    setIsLoading(false)
  }

  const handleDelete = async (dua: Dua) => {
    if (!confirm("Are you sure you want to delete this dua?")) return

    setIsLoading(true)
    const result = await deleteDua(dua.id)

    if (result.error) {
      toast({ title: "Error", description: "Failed to delete dua", variant: "destructive" })
    } else {
      setDuas((prev) => prev.filter((d) => d.id !== dua.id))
      toast({ title: "Success", description: "Dua deleted successfully" })
    }
    setIsLoading(false)
  }

  const openEditDialog = (dua: Dua) => {
    setEditingDua(dua)
    setEditText(dua.text)
    setEditCategory(dua.category_id?.toString() ?? "none")
  }

  const handleSaveEdit = async () => {
    if (!editingDua) return

    setIsLoading(true)
    const categoryId = editCategory === "none" ? null : Number.parseInt(editCategory)
    const result = await updateDua(editingDua.id, editText, categoryId)

    if (result.error) {
      toast({ title: "Error", description: "Failed to update dua", variant: "destructive" })
    } else {
      setDuas((prev) =>
        prev.map((d) =>
          d.id === editingDua.id
            ? {
                ...d,
                text: editText,
                category_id: categoryId,
                category_name: categoryId ? categories.find((c) => c.id === categoryId)?.name : undefined,
              }
            : d,
        ),
      )
      toast({ title: "Success", description: "Dua updated successfully" })
      setEditingDua(null)
    }
    setIsLoading(false)
  }

  const bulkPublish = async () => {
    await runBulk("Publish", async (dua) => {
      if (dua.published) return { success: true }
      const result = await updateDuaStatus(dua.id, true)
      if (!result.error) {
        setDuas((prev) => prev.map((d) => (d.id === dua.id ? { ...d, published: true } : d)))
      }
      return result
    })
  }

  const bulkUnpublish = async () => {
    await runBulk("Unpublish", async (dua) => {
      if (!dua.published) return { success: true }
      const result = await updateDuaStatus(dua.id, false)
      if (!result.error) {
        setDuas((prev) => prev.map((d) => (d.id === dua.id ? { ...d, published: false } : d)))
      }
      return result
    })
  }

  const bulkUnflag = async () => {
    const flagged = selectedDuas.filter((dua) => dua.flagged)
    if (flagged.length === 0) {
      toast({ title: "Nothing to unflag", description: "No flagged duas in selection." })
      return
    }
    await runBulk("Unflag", async (dua) => {
      if (!dua.flagged) return { success: true }
      const result = await unflagDua(dua.id)
      if (!result.error) {
        setDuas((prev) => prev.map((d) => (d.id === dua.id ? { ...d, flagged: false } : d)))
      }
      return result
    })
  }

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selectedCount} dua(s)? This cannot be undone.`)) return
    await runBulk("Delete", async (dua) => {
      const result = await deleteDua(dua.id)
      if (!result.error) {
        setDuas((prev) => prev.filter((d) => d.id !== dua.id))
      }
      return result
    })
  }

  if (duas.length === 0) {
    return <div className="py-8 text-center text-sm text-muted-foreground">No duas found matching your filters.</div>
  }

  return (
    <>
      <AdminBulkActionsBar
        selectedCount={selectedCount}
        onClear={clear}
        actions={[
          { label: "Publish", onClick: bulkPublish, disabled: isLoading },
          { label: "Unpublish", onClick: bulkUnpublish, disabled: isLoading },
          {
            label: "Unflag",
            onClick: bulkUnflag,
            disabled: isLoading || !selectedDuas.some((dua) => dua.flagged),
          },
          { label: "Delete", onClick: bulkDelete, variant: "destructive", disabled: isLoading },
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
                  aria-label="Select all duas"
                />
              </TableHead>
              <TableHead className="py-2">Content</TableHead>
              <TableHead className="hidden py-2 sm:table-cell">Category</TableHead>
              <TableHead className="py-2">Status</TableHead>
              <TableHead className="hidden py-2 md:table-cell">Ameen</TableHead>
              <TableHead className="hidden py-2 lg:table-cell">Flag</TableHead>
              <TableHead className="w-10 py-2 pr-3 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {duas.map((dua) => (
              <TableRow key={dua.id} className="text-sm">
                <TableCell className="px-3 py-2">
                  <Checkbox
                    checked={selected.has(dua.id)}
                    onCheckedChange={() => toggle(dua.id)}
                    aria-label={`Select dua ${dua.id}`}
                  />
                </TableCell>
                <TableCell className="max-w-[240px] py-2">
                  <p className="truncate font-medium text-foreground" title={dua.text}>
                    {truncateText(dua.text)}
                  </p>
                  {dua.category_name ? (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground sm:hidden">{dua.category_name}</p>
                  ) : null}
                </TableCell>
                <TableCell className="hidden py-2 sm:table-cell">
                  {dua.category_name ? (
                    <AdminStatusBadge label={dua.category_name} tone="neutral" />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="py-2">
                  <AdminStatusBadge
                    label={dua.published ? "Published" : "Unpublished"}
                    tone={dua.published ? "success" : "warning"}
                  />
                </TableCell>
                <TableCell className="hidden py-2 text-muted-foreground md:table-cell">{dua.likes}</TableCell>
                <TableCell className="hidden py-2 lg:table-cell">
                  {dua.flagged ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                      <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                      Flagged
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="py-2 pr-3 text-right">
                  <AdminRowActionsMenu
                    disabled={isLoading}
                    label={`Actions for dua ${dua.id}`}
                    actions={[
                      { label: "Edit", onClick: () => openEditDialog(dua) },
                      {
                        label: dua.published ? "Unpublish" : "Publish",
                        onClick: () => handleTogglePublish(dua),
                      },
                      ...(dua.flagged ? [{ label: "Unflag", onClick: () => handleUnflag(dua) }] : []),
                      {
                        label: "Delete",
                        onClick: () => handleDelete(dua),
                        destructive: true,
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

      <Dialog open={!!editingDua} onOpenChange={(open) => !open && setEditingDua(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Dua</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-text">Text</Label>
              <Textarea id="edit-text" value={editText} onChange={(e) => setEditText(e.target.value)} rows={5} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger id="edit-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDua(null)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
