"use client"

import { useState } from "react"
import { getApplicationFileUrl } from "@/app/actions/application-uploads"
import { toast } from "@/components/ui/use-toast"
import {
  isFileAnswer,
  visibleFields,
  type FormAnswerValue,
  type FormFileAnswer,
  type FormRegistry,
} from "@/lib/form-fields"

type ApplicationAnswersProps = {
  registry: FormRegistry
  /** Registry-driven answers keyed by field id (new submissions). */
  answers?: Record<string, FormAnswerValue> | null
  /** Legacy top-level application keys (old rows without a `fields` map). */
  legacy?: Record<string, unknown> | null
  title?: string
}

function FileAnswerLink({ file }: { file: FormFileAnswer }) {
  const [loading, setLoading] = useState(false)

  const open = async () => {
    setLoading(true)
    const result = await getApplicationFileUrl(file.path)
    setLoading(false)
    if ("error" in result) {
      toast({ title: "Could not open file", description: result.error, variant: "destructive" })
      return
    }
    window.open(result.url, "_blank", "noopener,noreferrer")
  }

  return (
    <button
      type="button"
      onClick={open}
      disabled={loading}
      className="text-left text-primary underline-offset-2 hover:underline disabled:opacity-60"
    >
      {loading ? "Opening…" : file.name || "View file"}
    </button>
  )
}

function renderValue(value: FormAnswerValue): React.ReactNode {
  if (isFileAnswer(value)) return <FileAnswerLink file={value} />
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (Array.isArray(value)) return value.join(", ")
  return String(value)
}

export function ApplicationAnswers({ registry, answers, legacy, title = "Submitted application details" }: ApplicationAnswersProps) {
  const rows: Array<{ label: string; value: FormAnswerValue }> = []

  for (const field of visibleFields(registry)) {
    if (!field.showInReview) continue
    const raw =
      answers?.[field.id] ??
      (legacy?.[field.id] as FormAnswerValue | undefined) ??
      (legacy?.[field.key] as FormAnswerValue | undefined)

    if (raw === undefined || raw === null) continue
    if (typeof raw === "string" && raw.trim() === "") continue
    if (Array.isArray(raw) && raw.length === 0) continue
    rows.push({ label: field.label, value: raw })
  }

  if (rows.length === 0) return null

  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
      <p className="text-sm font-medium">{title}</p>
      <dl className="grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col">
            <dt className="text-xs text-muted-foreground">{row.label}</dt>
            <dd className="break-words">{renderValue(row.value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
