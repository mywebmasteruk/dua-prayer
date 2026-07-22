"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react"
import { AdminSection } from "@/components/admin/admin-section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { saveFooterLinks } from "@/app/actions/footer-links"
import type { FooterLink } from "@/lib/footer-links-server"

type Row = FooterLink & { key: string }

let rowSeq = 0
function newKey() {
  rowSeq += 1
  return `row-${Date.now()}-${rowSeq}`
}

export function FooterLinksSettings({
  initialLinks,
  defaults,
}: {
  initialLinks: FooterLink[]
  defaults: ReadonlyArray<FooterLink>
}) {
  const [rows, setRows] = useState<Row[]>(() => {
    const seed = initialLinks.length > 0 ? initialLinks : defaults
    return seed.map((link) => ({ ...link, key: newKey() }))
  })
  const [isSaving, setIsSaving] = useState(false)

  const updateRow = (key: string, patch: Partial<FooterLink>) => {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  const removeRow = (key: string) => {
    setRows((prev) => prev.filter((row) => row.key !== key))
  }

  const moveRow = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= rows.length) return
    setRows((prev) => {
      const next = [...prev]
      const [moved] = next.splice(index, 1)
      next.splice(target, 0, moved)
      return next
    })
  }

  const addRow = () => {
    setRows((prev) => [...prev, { label: "", href: "", openInNewTab: false, key: newKey() }])
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    const payload: FooterLink[] = rows.map(({ key: _, ...link }) => link)
    const result = await saveFooterLinks(payload)
    setIsSaving(false)

    if ("error" in result && result.error) {
      toast({ title: "Could not save footer links", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: "Footer links saved", description: "The site footer will update shortly." })
  }

  return (
    <AdminSection
      title="Footer Links"
      description="Add, edit, reorder, and delete the links shown in the site footer. Sign-in and RSS are managed automatically and don't appear here."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {rows.length === 0 ? (
          <p className="rounded-md border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
            No footer links yet. Add one below — or save empty to fall back to the built-in defaults (Home, Donate, Volunteer).
          </p>
        ) : (
          <ul className="space-y-3">
            {rows.map((row, index) => (
              <li key={row.key} className="space-y-3 rounded-md border border-border/60 p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Link {index + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveRow(index, -1)}
                      disabled={index === 0}
                      title="Move up"
                    >
                      <ArrowUp className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">Move up</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveRow(index, 1)}
                      disabled={index === rows.length - 1}
                      title="Move down"
                    >
                      <ArrowDown className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">Move down</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRow(row.key)}
                      title="Delete link"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                      <span className="sr-only">Delete link</span>
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor={`${row.key}-label`} className="text-xs font-medium text-foreground">
                      Label
                    </Label>
                    <Input
                      id={`${row.key}-label`}
                      value={row.label}
                      onChange={(e) => updateRow(row.key, { label: e.target.value })}
                      placeholder="About"
                      maxLength={64}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`${row.key}-href`} className="text-xs font-medium text-foreground">
                      URL
                    </Label>
                    <Input
                      id={`${row.key}-href`}
                      value={row.href}
                      onChange={(e) => updateRow(row.key, { href: e.target.value })}
                      placeholder="/about or https://example.com"
                    />
                  </div>
                </div>

                <label className="flex items-center justify-between gap-3 rounded-md border border-border/40 px-3 py-2 text-sm">
                  <span>
                    <span className="block font-medium text-foreground">Open in new tab</span>
                    <span className="block text-xs text-muted-foreground">Adds target=&quot;_blank&quot; rel=&quot;noopener&quot;.</span>
                  </span>
                  <Switch
                    checked={row.openInNewTab}
                    onCheckedChange={(value) => updateRow(row.key, { openInNewTab: value })}
                    aria-label="Open in new tab"
                  />
                </label>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={addRow}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add link
          </Button>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : (
              "Save footer links"
            )}
          </Button>
        </div>
      </form>
    </AdminSection>
  )
}
