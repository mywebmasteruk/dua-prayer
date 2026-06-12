import type { VolunteerApplicationPayload } from "@/lib/volunteer-types"

export type ParsedVolunteerWebhook = {
  email: string
  name: string | null
  application: VolunteerApplicationPayload
}

export type VolunteerWebhookParseFailure = {
  error: string
  hint?: string
  receivedKeys?: string[]
}

const EMAIL_KEYS = ["email", "e-mail", "email address", "emailaddress"]
const NAME_KEYS = ["name", "full name", "fullname", "your name"]
const MESSAGE_KEYS = ["message", "note", "comments", "comment", "why", "motivation"]
const SKILLS_KEYS = [
  "skills",
  "area of support",
  "area_of_support",
  "support area",
  "interests",
  "expertise",
]
const TIMEZONE_KEYS = ["timezone", "time zone", "time_zone", "tz"]
const AVAILABILITY_KEYS = ["availability", "hours", "when available", "schedule"]

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ")
}

function asString(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }
  if (Array.isArray(value)) {
    const parts = value.map(asString).filter(Boolean) as string[]
    return parts.length > 0 ? parts.join(", ") : null
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>
    const parts = Object.values(obj).map(asString).filter(Boolean) as string[]
    return parts.length > 0 ? parts.join(", ") : null
  }
  return null
}

function pickFromRecord(record: Record<string, unknown>, keys: string[]): string | null {
  const normalizedKeys = new Set(keys.map(normalizeKey))
  for (const [rawKey, rawValue] of Object.entries(record)) {
    if (normalizedKeys.has(normalizeKey(rawKey))) {
      const val = asString(rawValue)
      if (val) return val
    }
  }
  return null
}

type FilloutNamedValue = {
  name?: unknown
  value?: unknown
}

function namedValuesToRecord(values: unknown): Record<string, unknown> {
  if (!Array.isArray(values)) return {}
  const record: Record<string, unknown> = {}
  for (const item of values) {
    if (!item || typeof item !== "object") continue
    const namedValue = item as FilloutNamedValue
    const name = asString(namedValue.name)
    if (!name) continue
    record[name] = namedValue.value
  }
  return record
}

function flattenPayload(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) return {}

  const root = body as Record<string, unknown>
  const flat: Record<string, unknown> = { ...root }

  for (const nestKey of ["submission", "data", "application", "payload", "formResponse"]) {
    const nested = root[nestKey]
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      Object.assign(flat, nested as Record<string, unknown>)
    }
  }

  const submission = root.submission
  if (submission && typeof submission === "object" && !Array.isArray(submission)) {
    const submissionRecord = submission as Record<string, unknown>
    Object.assign(flat, namedValuesToRecord(submissionRecord.questions))
    Object.assign(flat, namedValuesToRecord(submissionRecord.urlParameters))
    Object.assign(flat, namedValuesToRecord(submissionRecord.calculations))
  }

  Object.assign(flat, namedValuesToRecord(root.questions))
  Object.assign(flat, namedValuesToRecord(root.urlParameters))
  Object.assign(flat, namedValuesToRecord(root.calculations))

  return flat
}

export function parseVolunteerWebhookBody(
  body: unknown,
): ParsedVolunteerWebhook | VolunteerWebhookParseFailure {
  const flat = flattenPayload(body)
  const receivedKeys = Object.keys(flat)

  const email = pickFromRecord(flat, EMAIL_KEYS)
  if (!email) {
    const preview = receivedKeys.slice(0, 20)
    return {
      error: "email is required.",
      hint:
        preview.length > 0
          ? `No email field found. Received keys: ${preview.join(", ")}${receivedKeys.length > 20 ? "…" : ""}. Include an Email question or map "email" in the Fillout webhook body.`
          : "Empty or unrecognizable body. Send JSON with email or use Fillout's default webhook payload.",
      receivedKeys: preview,
    }
  }

  const nestedApplication =
    body &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    (body as Record<string, unknown>).application &&
    typeof (body as Record<string, unknown>).application === "object" &&
    !Array.isArray((body as Record<string, unknown>).application)
      ? ((body as Record<string, unknown>).application as Record<string, unknown>)
      : null

  const message =
    pickFromRecord(flat, MESSAGE_KEYS) ??
    (nestedApplication ? pickFromRecord(nestedApplication, MESSAGE_KEYS) : null)
  const skills =
    pickFromRecord(flat, SKILLS_KEYS) ??
    (nestedApplication ? pickFromRecord(nestedApplication, SKILLS_KEYS) : null)
  const timezone =
    pickFromRecord(flat, TIMEZONE_KEYS) ??
    (nestedApplication ? pickFromRecord(nestedApplication, TIMEZONE_KEYS) : null)
  const availability =
    pickFromRecord(flat, AVAILABILITY_KEYS) ??
    (nestedApplication ? pickFromRecord(nestedApplication, AVAILABILITY_KEYS) : null)
  const source = pickFromRecord(flat, ["source"]) ?? "fillout"

  return {
    email,
    name: pickFromRecord(flat, NAME_KEYS),
    application: {
      message,
      skills,
      timezone,
      availability,
      source,
    },
  }
}

function searchParamsToRecord(request: Request): Record<string, string> {
  const params = new URL(request.url).searchParams
  const body: Record<string, string> = {}
  params.forEach((value, key) => {
    body[key] = value
  })
  return body
}

function formParamsToRecord(text: string): Record<string, string> {
  const params = new URLSearchParams(text)
  const body: Record<string, string> = {}
  params.forEach((value, key) => {
    body[key] = value
  })
  return body
}

function mergeParams(body: unknown, params: Record<string, string>): unknown {
  if (Object.keys(params).length === 0) return body
  if (body && typeof body === "object" && !Array.isArray(body)) {
    return { ...params, ...(body as Record<string, unknown>) }
  }
  return body
}

export async function readVolunteerWebhookBody(
  request: Request,
): Promise<{ ok: true; body: unknown } | { ok: false; error: string }> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? ""
  const queryParams = searchParamsToRecord(request)

  try {
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await request.text()
      const formBody = formParamsToRecord(text)
      const body = { ...queryParams, ...formBody }
      if (Object.keys(body).length === 0) {
        return { ok: false, error: "Empty request body." }
      }
      return { ok: true, body }
    }

    const text = await request.text()
    if (!text.trim()) {
      if (Object.keys(queryParams).length > 0) {
        return { ok: true, body: queryParams }
      }
      return { ok: false, error: "Empty request body." }
    }

    if (contentType.includes("application/json") || contentType === "" || text.trimStart().startsWith("{")) {
      try {
        return { ok: true, body: mergeParams(JSON.parse(text) as unknown, queryParams) }
      } catch {
        // fall through to form-urlencoded attempt
      }
    }

    if (text.includes("=")) {
      const formBody = formParamsToRecord(text)
      const body = { ...queryParams, ...formBody }
      if (Object.keys(body).length > 0) {
        return { ok: true, body }
      }
    }

    return { ok: false, error: "Invalid JSON body." }
  } catch {
    return { ok: false, error: "Could not read request body." }
  }
}
