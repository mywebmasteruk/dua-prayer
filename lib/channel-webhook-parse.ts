import type { ChannelApplicationInput } from "@/lib/channel-application-types"
import { readVolunteerWebhookBody } from "@/lib/volunteer-webhook-parse"

export type ParsedChannelWebhook = {
  channelName: string
  description: string
  applicantEmail: string
  applicantName: string | null
  handle: string | null
  filloutSubmissionId: string | null
  payload: NonNullable<ChannelApplicationInput["payload"]>
}

export type ChannelWebhookParseFailure = {
  error: string
  hint?: string
  receivedKeys?: string[]
}

const EMAIL_KEYS = ["email", "e-mail", "email address", "emailaddress", "applicant email", "contact email"]
const APPLICANT_NAME_KEYS = ["name", "full name", "fullname", "your name", "contact name", "applicant name"]
const CHANNEL_NAME_KEYS = [
  "channel name",
  "channel",
  "channel title",
  "title",
  "community name",
  "organization name",
  "masjid name",
  "name of channel",
]
const DESCRIPTION_KEYS = ["description", "about", "about your channel", "channel description", "summary", "details"]
const HANDLE_KEYS = ["handle", "channel handle", "slug", "username", "short name"]
const MESSAGE_KEYS = ["message", "note", "comments", "comment", "additional info", "anything else"]
const ORGANIZATION_KEYS = ["organization", "organisation", "org", "community", "masjid", "institution"]
const WEBSITE_KEYS = ["website", "url", "link", "site"]

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

type FilloutQuestion = {
  name?: unknown
  value?: unknown
}

function questionsToRecord(questions: unknown): Record<string, unknown> {
  if (!Array.isArray(questions)) return {}
  const record: Record<string, unknown> = {}
  for (const q of questions) {
    if (!q || typeof q !== "object") continue
    const question = q as FilloutQuestion
    const name = asString(question.name)
    if (!name) continue
    record[name] = question.value
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
    Object.assign(flat, questionsToRecord((submission as Record<string, unknown>).questions))
  }

  Object.assign(flat, questionsToRecord(root.questions))

  return flat
}

function extractSubmissionId(body: unknown, flat: Record<string, unknown>): string | null {
  // Only explicit submission-id keys: a generic `id` in the flattened payload
  // is often a constant (e.g. the form id), which would make every new
  // application dedupe-match the first one and get silently dropped.
  const fromFlat =
    pickFromRecord(flat, ["submission id", "submissionid", "fillout submission id"]) ??
    asString(flat.submissionId) ??
    asString(flat.submission_id)

  if (fromFlat) return fromFlat

  if (body && typeof body === "object" && !Array.isArray(body)) {
    const submission = (body as Record<string, unknown>).submission
    if (submission && typeof submission === "object" && !Array.isArray(submission)) {
      return asString((submission as Record<string, unknown>).submissionId ?? (submission as Record<string, unknown>).id)
    }
  }

  return null
}

export function parseChannelWebhookBody(
  body: unknown,
): ParsedChannelWebhook | ChannelWebhookParseFailure {
  const flat = flattenPayload(body)
  const receivedKeys = Object.keys(flat)

  const applicantEmail = pickFromRecord(flat, EMAIL_KEYS)
  if (!applicantEmail) {
    const preview = receivedKeys.slice(0, 20)
    return {
      error: "applicant email is required.",
      hint:
        preview.length > 0
          ? `No email field found. Received keys: ${preview.join(", ")}${receivedKeys.length > 20 ? "…" : ""}. Include an Email question or map "email" in the Fillout webhook body.`
          : "Empty or unrecognizable body. Send JSON with email or use Fillout's default webhook payload.",
      receivedKeys: preview,
    }
  }

  const channelName =
    pickFromRecord(flat, CHANNEL_NAME_KEYS) ??
    pickFromRecord(flat, ["channel name"]) ??
    pickFromRecord(flat, ORGANIZATION_KEYS)

  if (!channelName) {
    const preview = receivedKeys.slice(0, 20)
    return {
      error: "channel name is required.",
      hint:
        preview.length > 0
          ? `No channel name field found. Received keys: ${preview.join(", ")}${receivedKeys.length > 20 ? "…" : ""}. Map a "Channel name" (or similar) question in Fillout.`
          : "Include channelName or a Channel name question in the webhook body.",
      receivedKeys: preview,
    }
  }

  const description = pickFromRecord(flat, DESCRIPTION_KEYS) ?? ""
  const applicantName = pickFromRecord(flat, APPLICANT_NAME_KEYS)
  const handle = pickFromRecord(flat, HANDLE_KEYS)
  const source = pickFromRecord(flat, ["source"]) ?? "fillout"

  const payload: NonNullable<ChannelApplicationInput["payload"]> = {
    message: pickFromRecord(flat, MESSAGE_KEYS) ?? undefined,
    organization: pickFromRecord(flat, ORGANIZATION_KEYS) ?? undefined,
    website: pickFromRecord(flat, WEBSITE_KEYS) ?? undefined,
    source,
  }

  return {
    channelName,
    description,
    applicantEmail,
    applicantName,
    handle,
    filloutSubmissionId: extractSubmissionId(body, flat),
    payload,
  }
}

export { readVolunteerWebhookBody as readChannelWebhookBody }
