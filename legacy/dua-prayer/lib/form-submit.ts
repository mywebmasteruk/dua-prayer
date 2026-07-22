import {
  fieldForBinding,
  isFileAnswer,
  visibleFields,
  type FormAnswerValue,
  type FormRegistry,
} from "@/lib/form-fields"

/** Hidden honeypot field name. Distinct from any real "website" field. */
export const HONEYPOT_FIELD = "company_url"
/** Cloudflare Turnstile token field name. */
export const TURNSTILE_FIELD = "cf-turnstile-response"

/** Read registry answers out of a submitted FormData, keyed by field id. */
export function readAnswersFromFormData(
  registry: FormRegistry,
  formData: FormData,
): Record<string, FormAnswerValue> {
  const answers: Record<string, FormAnswerValue> = {}

  for (const field of visibleFields(registry)) {
    const key = field.id

    if (field.type === "file") {
      const raw = formData.get(key)
      if (typeof raw === "string" && raw.trim()) {
        try {
          const parsed = JSON.parse(raw)
          if (isFileAnswer(parsed)) {
            answers[key] = { path: parsed.path, name: parsed.name, size: parsed.size, type: parsed.type }
          }
        } catch {
          // ignore malformed file metadata
        }
      }
      continue
    }

    if (field.type === "multiselect") {
      const values = formData.getAll(key).filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      if (values.length > 0) answers[key] = values
      continue
    }

    if (field.type === "checkbox") {
      const raw = formData.get(key)
      answers[key] = raw === "true" || raw === "on" || raw === "1"
      continue
    }

    const raw = formData.get(key)
    if (typeof raw === "string" && raw.trim()) answers[key] = raw.trim()
  }

  return answers
}

/** Resolve the string answer for a system binding (or null if unbound/empty). */
export function boundString(
  registry: FormRegistry,
  answers: Record<string, FormAnswerValue>,
  binding: string,
): string | null {
  const field = fieldForBinding(registry, binding)
  if (!field) return null
  const value = answers[field.id]
  return typeof value === "string" && value.trim() ? value.trim() : null
}

/** Convenience: read a plain string answer by field id (for back-compat mapping). */
export function stringAnswer(
  answers: Record<string, FormAnswerValue>,
  id: string,
): string | undefined {
  const value = answers[id]
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

/**
 * Human-readable summary of an answer for a denormalized column: joins a
 * multiselect's selected option LABELS (falling back to values), or returns the
 * plain string answer. Null when empty.
 */
export function readableAnswer(
  registry: FormRegistry,
  answers: Record<string, FormAnswerValue>,
  id: string,
): string | null {
  const value = answers[id]
  if (Array.isArray(value)) {
    if (value.length === 0) return null
    const field = visibleFields(registry).find((f) => f.id === id)
    const byValue = new Map((field?.options ?? []).map((o) => [o.value, o.label]))
    return value.map((v) => byValue.get(v) ?? v).join(", ")
  }
  return stringAnswer(answers, id) ?? null
}
