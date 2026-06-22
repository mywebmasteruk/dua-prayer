"use client"

import { useRef, useState } from "react"
import { ChevronDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { TurnstileWidget, type TurnstileWidgetHandle } from "@/components/turnstile-widget"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { requestApplicationUpload } from "@/app/actions/application-uploads"
import { checkChannelHandleAvailability } from "@/app/actions/channel-applications"
import {
  isFieldVisible,
  validateAnswers,
  visibleFields,
  type FormAnswerValue,
  type FormFieldDefinition,
  type FormFileAnswer,
  type FormKind,
  type FormRegistry,
} from "@/lib/form-fields"
import { HONEYPOT_FIELD, TURNSTILE_FIELD } from "@/lib/form-submit"
import { cn } from "@/lib/utils"

// Field types that read better spanning the full form width (one per row).
const FULL_WIDTH_TYPES = new Set(["textarea", "file", "checkbox", "multiselect", "radio"])

// Whether a field should span both grid columns. Short multi-selects (few
// options) sit half-width so they pair with a neighbour (e.g. Availability next
// to Timezone); long option lists stay full-width for readability.
function fieldSpansFullWidth(field: FormFieldDefinition): boolean {
  if (!FULL_WIDTH_TYPES.has(field.type)) return false
  if (field.type === "multiselect") return (field.options?.length ?? 0) > 8
  return true
}

type SubmitResult = { success: true } | { error: string } | { success: true; status: string }

type DynamicFormProps = {
  formKind: FormKind
  registry: FormRegistry
  action: (formData: FormData) => Promise<SubmitResult>
  prefill?: { email?: string | null; name?: string | null }
  /** When true, fields prefilled from the signed-in account (name/email) render read-only. */
  lockPrefill?: boolean
  turnstileSiteKey?: string | null
  submitLabel: string
  onSuccess?: () => void
}

// System bindings that come from the signed-in account and should lock when prefilled.
const ACCOUNT_BOUND = new Set(["email", "name"])

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

export function DynamicForm({
  formKind,
  registry,
  action,
  prefill,
  lockPrefill = false,
  turnstileSiteKey,
  submitLabel,
  onSuccess,
}: DynamicFormProps) {
  const fields = visibleFields(registry)

  const [values, setValues] = useState<Record<string, FormAnswerValue>>(() => {
    const initial: Record<string, FormAnswerValue> = {}
    for (const field of fields) {
      if (field.systemBinding === "email" && prefill?.email) initial[field.id] = prefill.email
      if (field.systemBinding === "name" && prefill?.name) initial[field.id] = prefill.name
      if (field.type === "checkbox") initial[field.id] = false
    }
    return initial
  })

  // Account-bound fields prefilled from the signed-in user — shown read-only.
  const lockedIds = new Set(
    lockPrefill
      ? fields
          .filter(
            (field) =>
              field.systemBinding &&
              ACCOUNT_BOUND.has(field.systemBinding) &&
              ((field.systemBinding === "email" && prefill?.email) ||
                (field.systemBinding === "name" && prefill?.name)),
          )
          .map((field) => field.id)
      : [],
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileWidgetHandle>(null)

  // Fields currently visible given conditional (`visibleWhen`) rules.
  const shownFields = fields.filter((field) => isFieldVisible(field, values))

  const setValue = (id: string, value: FormAnswerValue | undefined) => {
    setValues((prev) => {
      const next = { ...prev }
      if (value === undefined) delete next[id]
      else next[id] = value
      return next
    })
    setErrors((prev) => {
      if (!prev[id]) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  async function handleFile(field: FormFieldDefinition, file: File | undefined) {
    if (!file) {
      setValue(field.id, undefined)
      return
    }
    setUploading((p) => ({ ...p, [field.id]: true }))
    try {
      const signed = await requestApplicationUpload({
        form: formKind,
        fieldId: field.id,
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      })
      if (!signed.ok) {
        setErrors((p) => ({ ...p, [field.id]: signed.error }))
        return
      }
      const supabase = createClientSupabaseClient()
      const { error } = await supabase.storage
        .from(signed.bucket)
        .uploadToSignedUrl(signed.path, signed.token, file)
      if (error) {
        setErrors((p) => ({ ...p, [field.id]: "Upload failed. Please try again." }))
        return
      }
      const answer: FormFileAnswer = { path: signed.path, name: file.name, size: file.size, type: file.type }
      setValue(field.id, answer)
    } finally {
      setUploading((p) => ({ ...p, [field.id]: false }))
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (submitting) return

    const validation = validateAnswers(registry, values)
    if (!validation.ok) {
      setErrors(validation.errors)
      return
    }
    if (turnstileSiteKey && !turnstileToken) {
      toast({ title: "Please complete the verification.", variant: "destructive" })
      return
    }

    setSubmitting(true)
    const formData = new FormData()
    formData.set(HONEYPOT_FIELD, "")
    if (turnstileToken) formData.set(TURNSTILE_FIELD, turnstileToken)

    for (const field of shownFields) {
      const value = values[field.id]
      if (value === undefined) continue
      if (field.type === "file" && typeof value === "object" && !Array.isArray(value)) {
        formData.set(field.id, JSON.stringify(value))
      } else if (field.type === "multiselect" && Array.isArray(value)) {
        for (const entry of value) formData.append(field.id, entry)
      } else if (field.type === "checkbox") {
        formData.set(field.id, value === true ? "true" : "")
      } else if (typeof value === "string") {
        formData.set(field.id, value)
      }
    }

    const result = await action(formData)
    setSubmitting(false)

    if ("error" in result) {
      toast({ title: "Could not submit", description: result.error, variant: "destructive" })
      turnstileRef.current?.reset()
      setTurnstileToken(null)
      return
    }

    toast({ title: "Application submitted", description: "Thanks — we'll review it and follow up by email." })
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
        {shownFields.map((field) => (
          <div key={field.id} className={cn(FULL_WIDTH_TYPES.has(field.type) && "sm:col-span-2")}>
            {field.systemBinding === "handle" ? (
              <HandleField
                field={field}
                value={values[field.id]}
                error={errors[field.id]}
                onChange={(value) => setValue(field.id, value)}
              />
            ) : (
              <FieldRow
                field={field}
                value={values[field.id]}
                error={errors[field.id]}
                uploading={!!uploading[field.id]}
                readOnly={lockedIds.has(field.id)}
                onChange={(value) => setValue(field.id, value)}
                onFile={(file) => handleFile(field, file)}
                selectClass={SELECT_CLASS}
              />
            )}
          </div>
        ))}
      </div>

      {/* Honeypot — visually hidden, ignored by users, filled only by bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          Company URL
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            name={HONEYPOT_FIELD}
            onChange={() => {}}
          />
        </label>
      </div>

      {turnstileSiteKey ? (
        <TurnstileWidget
          ref={turnstileRef}
          siteKey={turnstileSiteKey}
          onVerify={setTurnstileToken}
          onExpire={() => setTurnstileToken(null)}
        />
      ) : null}

      <Button type="submit" size="lg" className="rounded-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Submitting…
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  )
}

type FieldRowProps = {
  field: FormFieldDefinition
  value: FormAnswerValue | undefined
  error?: string
  uploading: boolean
  readOnly?: boolean
  onChange: (value: FormAnswerValue | undefined) => void
  onFile: (file: File | undefined) => void
  selectClass: string
}

function FieldRow({ field, value, error, uploading, readOnly = false, onChange, onFile, selectClass }: FieldRowProps) {
  const id = `field-${field.id}`
  const labelText = field.required ? `${field.label} *` : field.label

  const control = () => {
    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            id={id}
            rows={4}
            placeholder={field.placeholder}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
          />
        )
      case "select":
        return (
          <select
            id={id}
            className={selectClass}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value || undefined)}
          >
            <option value="">Select…</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )
      case "multiselect":
        return <MultiSelectDropdown field={field} value={value} onChange={onChange} triggerClass={selectClass} />
      case "radio":
        return (
          <div className="space-y-2">
            {(field.options ?? []).map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={id}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={() => onChange(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        )
      case "checkbox":
        return (
          <label className="flex items-start gap-2 text-sm">
            <Checkbox checked={value === true} onCheckedChange={(checked) => onChange(checked === true)} />
            <span>{field.label}{field.required ? " *" : ""}</span>
          </label>
        )
      case "file":
        return (
          <div className="space-y-1.5">
            <input
              id={id}
              type="file"
              accept={field.fileConfig?.accept?.join(",")}
              onChange={(e) => onFile(e.target.files?.[0])}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary"
            />
            {uploading ? <p className="text-xs text-muted-foreground">Uploading…</p> : null}
            {value && typeof value === "object" && !Array.isArray(value) ? (
              <p className="text-xs text-emerald-700">Attached: {(value as FormFileAnswer).name}</p>
            ) : null}
          </div>
        )
      default:
        return (
          <Input
            id={id}
            type={field.type === "email" ? "email" : field.type === "url" ? "url" : field.type === "tel" ? "tel" : "text"}
            placeholder={field.placeholder}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            readOnly={readOnly}
            aria-readonly={readOnly || undefined}
            tabIndex={readOnly ? -1 : undefined}
            className={cn(readOnly && "cursor-not-allowed bg-muted text-muted-foreground")}
          />
        )
    }
  }

  return (
    <div className="space-y-1.5">
      {field.type !== "checkbox" ? <Label htmlFor={id}>{labelText}</Label> : null}
      {control()}
      {readOnly ? (
        <p className="text-xs text-muted-foreground">From your account.</p>
      ) : field.helpText ? (
        <p className="text-xs text-muted-foreground">{field.helpText}</p>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

// Dropdown that allows selecting several options; the trigger shows the chosen
// labels and the panel stays open while toggling.
function MultiSelectDropdown({
  field,
  value,
  onChange,
  triggerClass,
}: {
  field: FormFieldDefinition
  value: FormAnswerValue | undefined
  onChange: (value: FormAnswerValue | undefined) => void
  triggerClass: string
}) {
  const options = field.options ?? []
  const selected = Array.isArray(value) ? value : []
  const selectedLabels = options.filter((o) => selected.includes(o.value)).map((o) => o.label)
  const toggle = (optionValue: string, checked: boolean) => {
    if (checked) onChange([...selected, optionValue])
    else onChange(selected.filter((v) => v !== optionValue))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(triggerClass, "flex items-center justify-between gap-2 text-left font-normal")}
        >
          <span className={cn("truncate", selectedLabels.length === 0 && "text-muted-foreground")}>
            {selectedLabels.length > 0 ? selectedLabels.join(", ") : field.placeholder || "Select all that apply…"}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-64 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto"
      >
        {options.map((opt) => (
          <DropdownMenuCheckboxItem
            key={opt.value}
            checked={selected.includes(opt.value)}
            onCheckedChange={(checked) => toggle(opt.value, checked === true)}
            onSelect={(event) => event.preventDefault()}
          >
            {opt.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type HandleStatus =
  | { state: "checking" }
  | { state: "available"; normalized: string }
  | { state: "taken"; normalized: string; suggestions: string[] }

function HandleField({
  field,
  value,
  error,
  onChange,
}: {
  field: FormFieldDefinition
  value: FormAnswerValue | undefined
  error?: string
  onChange: (value: FormAnswerValue | undefined) => void
}) {
  const id = `field-${field.id}`
  const labelText = field.required ? `${field.label} *` : field.label
  const [status, setStatus] = useState<HandleStatus | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const seq = useRef(0)

  const runCheck = (raw: string) => {
    if (timer.current) clearTimeout(timer.current)
    // Mirror normalizeChannelHandle's "min 3 usable chars" gate before checking.
    if (raw.replace(/[^a-z0-9]/gi, "").length < 3) {
      setStatus(null)
      return
    }
    setStatus({ state: "checking" })
    const current = ++seq.current
    timer.current = setTimeout(async () => {
      const res = await checkChannelHandleAvailability(raw)
      if (current !== seq.current) return // a newer keystroke superseded this one
      setStatus(
        res.available
          ? { state: "available", normalized: res.normalized }
          : { state: "taken", normalized: res.normalized, suggestions: res.suggestions },
      )
    }, 500)
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{labelText}</Label>
      <Input
        id={id}
        type="text"
        placeholder={field.placeholder ?? "alnoor"}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => {
          onChange(e.target.value || undefined)
          runCheck(e.target.value)
        }}
      />
      {field.helpText ? <p className="text-xs text-muted-foreground">{field.helpText}</p> : null}
      {status?.state === "checking" ? (
        <p className="text-xs text-muted-foreground">Checking availability…</p>
      ) : null}
      {status?.state === "available" ? (
        <p className="text-xs font-medium text-emerald-700">@{status.normalized} is available</p>
      ) : null}
      {status?.state === "taken" ? (
        <div className="text-xs text-destructive">
          @{status.normalized} is taken.
          {status.suggestions.length > 0 ? (
            <span className="ml-1 inline-flex flex-wrap items-center gap-1.5 align-middle">
              <span className="text-muted-foreground">Try:</span>
              {status.suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    onChange(s)
                    runCheck(s)
                  }}
                  className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary transition hover:bg-primary/15"
                >
                  @{s}
                </button>
              ))}
            </span>
          ) : null}
        </div>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
