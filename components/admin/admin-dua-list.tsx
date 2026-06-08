"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Eye, EyeOff, Flag, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import type { Dua, Category } from "@/lib/types/dua"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateDuaStatus, unflagDua, updateDua, deleteDua } from "@/app/actions/duas"

interface AdminDuaListProps {
  initialDuas: Dua[]
  categories: Category[]
}

export function AdminDuaList({ initialDuas, categories }: AdminDuaListProps) {
  const [duas, setDuas] = useState<Dua[]>(initialDuas)
  const [editingDua, setEditingDua] = useState<Dua | null>(null)
  const [editText, setEditText] = useState("")
  const [editCategory, setEditCategory] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleTogglePublish = async (dua: Dua) => {
    setIsLoading(true)
    const result = await updateDuaStatus(dua.id, !dua.published)

    if (result.error) {
      toast({
        title: "Error",
        description: "Failed to update dua status",
        variant: "destructive",
      })
    } else {
      setDuas(duas.map((d) => (d.id === dua.id ? { ...d, published: !dua.published } : d)))
      toast({
        title: "Success",
        description: `Dua ${dua.published ? "unpublished" : "published"} successfully`,
      })
    }
    setIsLoading(false)
  }

  const handleUnflag = async (dua: Dua) => {
    setIsLoading(true)
    const result = await unflagDua(dua.id)

    if (result.error) {
      toast({
        title: "Error",
        description: "Failed to unflag dua",
        variant: "destructive",
      })
    } else {
      setDuas(duas.map((d) => (d.id === dua.id ? { ...d, flagged: false } : d)))
      toast({
        title: "Success",
        description: "Dua unflagged successfully",
      })
    }
    setIsLoading(false)
  }

  const handleDelete = async (dua: Dua) => {
    if (!confirm("Are you sure you want to delete this dua?")) return

    setIsLoading(true)
    const result = await deleteDua(dua.id)

    if (result.error) {
      toast({
        title: "Error",
        description: "Failed to delete dua",
        variant: "destructive",
      })
    } else {
      setDuas(duas.filter((d) => d.id !== dua.id))
      toast({
        title: "Success",
        description: "Dua deleted successfully",
      })
    }
    setIsLoading(false)
  }

  const openEditDialog = (dua: Dua) => {
    setEditingDua(dua)
    setEditText(dua.text)
    setEditCategory(dua.category_id?.toString() || "")
  }

  const handleSaveEdit = async () => {
    if (!editingDua) return

    setIsLoading(true)
    const result = await updateDua(editingDua.id, editText, editCategory ? Number.parseInt(editCategory) : null)

    if (result.error) {
      toast({
        title: "Error",
        description: "Failed to update dua",
        variant: "destructive",
      })
    } else {
      setDuas(
        duas.map((d) =>
          d.id === editingDua.id
            ? {
                ...d,
                text: editText,
                category_id: editCategory ? Number.parseInt(editCategory) : null,
                category_name: categories.find((c) => c.id.toString() === editCategory)?.name,
              }
            : d,
        ),
      )

      toast({
        title: "Success",
        description: "Dua updated successfully",
      })

      setEditingDua(null)
    }
    setIsLoading(false)
  }

  if (duas.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No duas found matching your filters.</div>
  }

  return (
    <>
      <div className="space-y-4">
        {duas.map((dua) => (
          <Card key={dua.id} className="p-4 border-border">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <div className="flex gap-2">
                  {dua.flagged && (
                    <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full">
                      Flagged
                    </span>
                  )}
                </div>
              </div>

              <p className="py-2">{dua.text}</p>

              <div className="flex flex-wrap justify-between items-center gap-2 mt-2">
                <div className="flex flex-wrap gap-2">
                  {dua.category_name && (
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                      {dua.category_name}
                    </span>
                  )}
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      dua.published
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }`}
                  >
                    {dua.published ? "Published" : "Unpublished"}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                    Ameen: {dua.likes}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(dua)} disabled={isLoading}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>

                  <Button variant="outline" size="sm" onClick={() => handleTogglePublish(dua)} disabled={isLoading}>
                    {dua.published ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-1" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-1" />
                        Publish
                      </>
                    )}
                  </Button>

                  {dua.flagged && (
                    <Button variant="outline" size="sm" onClick={() => handleUnflag(dua)} disabled={isLoading}>
                      <Flag className="h-4 w-4 mr-1" />
                      Unflag
                    </Button>
                  )}

                  <Button variant="destructive" size="sm" onClick={() => handleDelete(dua)} disabled={isLoading}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
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
                <SelectTrigger>
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
