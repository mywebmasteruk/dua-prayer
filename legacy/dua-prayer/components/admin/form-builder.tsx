"use client"

import { useState } from "react"
import { Loader2, Plus, ArrowUp, ArrowDown, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import {
  FORM_FIELD_TYPES,
  type FormFieldDefinition,
  type FormFieldType,
  type FormRegistry,
} from "@/lib/form-fields"

type BindingOption = { value: string; label: string }

type FormBuilderProps = {
  title: string
  description: string
  initialRegistry: FormRegistry
  bindingOptions: BindingOption[]
  requiredBindings: string[]
  action: (registry: FormRegistry) => Promise<{ success: true } | { error: string }>
}

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

const TYPES_WITH_OPTIONS: FormFieldType[] = ["select", "multiselect", "radio"]

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) || "field"
}

function newField(order: number): FormFieldDefinition {
  return { id: `f_${Date.now().toString(36)}`, key: "", label: "", type: "text", required: false, enabled: true, showInReview: true, order }
}

export function FormBuilder({ title, description, initialRegistry, bindingOptions, requiredBindings, action }: FormBuilderProps) {
  const [fields, setFields] = useState<FormFieldDefinition[]>(
    [...initialRegistry.fields].sort((a, b) => a.order - b.order),
  )
  const [editing, setEditing] = useState<FormFieldDefinition | null>(null)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const markDirty = () => setDirty(true)

  const move = (index: number, dir: -1 | 1) => {
    const next = [...fields]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setFields(next.map((f, i) => ({ ...f, order: (i + 1) * 10 })))
    markDirty()
  }

  const removeField = (field: FormFieldDefinition) => {
    if (field.systemBinding && requiredBindings.includes(field.systemBinding)) {
      toast({ title: "Can't delete", description: `${field.label} is required by the app.`, variant: "destructive" })
      return
    }
    if (!confirm(`Delete field "${field.label}"?`)) return
    setFields((prev) => prev.filter((f) => f.id !== field.id))
    markDirty()
  }

  const toggleEnabled = (field: FormFieldDefinition, enabled: boolean) => {
    if (!enabled && field.systemBinding && requiredBindings.includes(field.systemBinding)) {
      toast({ title: "Can't disable", description: `${field.label} is required by the app.`, variant: "destructive" })
      return
    }
    setFields((prev) => prev.map((f) => (f.id === field.id ? { ...f, enabled } : f)))
    markDirty()
  }

  const upsertField = (field: FormFieldDefinition) => {
    setFields((prev) => {
      const exists = prev.some((f) => f.id === field.id)
      return exists ? prev.map((f) => (f.id === field.id ? field : f)) : [...prev, field]
    })
    setEditing(null)
    markDirty()
  }

  const save = async () => {
    setSaving(true)
    const registry: FormRegistry = { version: 1, fields: fields.map((f, i) => ({ ...f, key: f.key || slugify(f.label), order: (i + 1) * 10 })) }
    const result = await action(registry)
    setSaving(false)
    if ("error" in result) {
      toast({ title: "Could not save", description: result.error, variant: "destructive" })
      return
    }
    setDirty(false)
    toast({ title: "Form saved", description: "The public form updates immediately." })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing(newField((fields.length + 1) * 10))}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Add field
          </Button>
          <Button type="button" size="sm" onClick={save} disabled={saving || !dirty}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {saving ? "Saving…" : "Save form"}
          </Button>
        </div>
      </div>

      <ul className="divide-y divide-border/60 rounded-xl border border-border/60">
        {fields.map((field, index) => (
          <li key={field.id} className="flex items-center gap-3 px-3 py-2.5">
            <div className="flex flex-col">
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="text-muted-foreground disabled:opacity-30">
                <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => move(index, 1)} disabled={index === fields.length - 1} className="text-muted-foreground disabled:opacity-30">
                <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {field.label || <span className="text-muted-foreground">(untitled)</span>}
                {field.required ? <span className="text-destructive"> *</span> : null}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {field.type}
                {field.systemBinding && field.systemBinding !== "none" ? ` · ${field.systemBinding}` : ""}
                {!field.enabled ? " · disabled" : ""}
              </p>
            </div>
            <Switch checked={field.enabled} onCheckedChange={(checked) => toggleEnabled(field, checked)} aria-label="Enabled" />
            <Button type="button" variant="ghost" size="icon" onClick={() => setEditing(field)}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => removeField(field)}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ul>

      {editing ? (
        <FieldEditor
          field={editing}
          bindingOptions={bindingOptions}
          onCancel={() => setEditing(null)}
          onSave={upsertField}
          selectClass={SELECT_CLASS}
        />
      ) : null}
    </div>
  )
}

function FieldEditor({
  field,
  bindingOptions,
  onCancel,
  onSave,
  selectClass,
}: {
  field: FormFieldDefinition
  bindingOptions: BindingOption[]
  onCancel: () => void
  onSave: (field: FormFieldDefinition) => void
  selectClass: string
}) {
  const [draft, setDraft] = useState<FormFieldDefinition>(field)
  const optionsText = (draft.options ?? []).map((o) => o.label).join("\n")

  const setOptionsFromText = (text: string) => {
    const options = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((label) => ({ value: slugify(label), label }))
    setDraft((d) => ({ ...d, options }))
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{field.label ? "Edit field" : "Add field"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fb-label">Label</Label>
            <Input id="fb-label" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fb-type">Type</Label>
              <select id="fb-type" className={selectClass} value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as FormFieldType })}>
                {FORM_FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fb-binding">System binding</Label>
              <select id="fb-binding" className={selectClass} value={draft.systemBinding ?? "none"} onChange={(e) => setDraft({ ...draft, systemBinding: e.target.value })}>
                {bindingOptions.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
          </div>

          {TYPES_WITH_OPTIONS.includes(draft.type) ? (
            <div className="space-y-1.5">
              <Label htmlFor="fb-options">Options (one per line)</Label>
              <Textarea id="fb-options" rows={4} value={optionsText} onChange={(e) => setOptionsFromText(e.target.value)} />
            </div>
          ) : null}

          {draft.type === "file" ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fb-accept">Accept (comma-separated MIME)</Label>
                <Input
                  id="fb-accept"
                  value={(draft.fileConfig?.accept ?? []).join(",")}
                  onChange={(e) => setDraft({ ...draft, fileConfig: { ...draft.fileConfig, accept: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fb-maxsize">Max size (MB)</Label>
                <Input
                  id="fb-maxsize"
                  type="number"
                  value={draft.fileConfig?.maxSizeMb ?? ""}
                  onChange={(e) => setDraft({ ...draft, fileConfig: { ...draft.fileConfig, maxSizeMb: Number(e.target.value) || undefined } })}
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="fb-placeholder">Placeholder</Label>
            <Input id="fb-placeholder" value={draft.placeholder ?? ""} onChange={(e) => setDraft({ ...draft, placeholder: e.target.value || undefined })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fb-help">Help text</Label>
            <Input id="fb-help" value={draft.helpText ?? ""} onChange={(e) => setDraft({ ...draft, helpText: e.target.value || undefined })} />
          </div>

          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={draft.required} onCheckedChange={(c) => setDraft({ ...draft, required: c })} /> Required
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={draft.showInReview} onCheckedChange={(c) => setDraft({ ...draft, showInReview: c })} /> Show in review
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onSave({ ...draft, key: draft.key || slugify(draft.label) })} disabled={!draft.label.trim()}>
            Save field
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
