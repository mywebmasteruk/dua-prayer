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
  bodyKind?: string
  acceptedPayloads?: string[]
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
const CHANNEL_TYPE_KEYS = ["type", "channel type", "channeltype"]
const SOCIAL_MEDIA_KEYS = [
  "socialmedialink",
  "social media link",
  "social media",
  "social media profile",
  "your social media profile",
  "social",
]
const LOCATION_KEYS = ["location", "country", "country location", "region", "city"]
const LANGUAGE_KEYS = ["langs", "language", "languages", "primary posting language", "posting language"]
const ROLE_KEYS = ["role", "i am", "your role"]
const REGISTRATION_NUMBER_KEYS = [
  "orgno",
  "org no",
  "organization number",
  "organisation number",
  "registration number",
  "legal entity registration no",
  "legal entity registration number",
  "company number",
]
const AGREE_KEYS = ["agreetc", "agree tc", "agree", "i agree", "terms", "agree to terms", "agreed"]
const ACCEPTED_PAYLOADS = [
  "Fillout default JSON with submission.questions[]",
  "JSON with email/name/channel fields",
  "nested submission/data/payload/formResponse/form_response objects",
  "answers arrays or question-id keyed answers",
  "application/x-www-form-urlencoded fields",
]

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

function asBoolean(value: string | null): boolean | undefined {
  if (value == null) return undefined
  const v = value.trim().toLowerCase()
  if (["false", "no", "n", "0", "off", "unchecked"].includes(v)) return false
  if (v.length === 0) return undefined
  // A single checkbox sends "true"/"yes"/the option label when ticked.
  return true
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
  id?: unknown
  key?: unknown
  name?: unknown
  title?: unknown
  label?: unknown
  value?: unknown
  field?: unknown
  question?: unknown
}

function objectRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function nestedLabel(value: unknown): string | null {
  const record = objectRecord(value)
  if (!record) return null
  return asString(record.name ?? record.title ?? record.label ?? record.ref ?? record.key ?? record.id)
}

function namedValueLabel(namedValue: FilloutNamedValue): string | null {
  return (
    asString(namedValue.name ?? namedValue.title ?? namedValue.label ?? namedValue.key) ??
    nestedLabel(namedValue.field) ??
    nestedLabel(namedValue.question)
  )
}

function answerValue(namedValue: FilloutNamedValue): unknown {
  if ("value" in namedValue) return namedValue.value

  const record = namedValue as Record<string, unknown>
  for (const valueKey of ["email", "text", "url", "phone", "number", "boolean", "date", "file_url"]) {
    if (valueKey in record) return record[valueKey]
  }

  const choice = objectRecord(record.choice)
  if (choice) return choice.label ?? choice.value ?? choice.name

  const choices = objectRecord(record.choices)
  if (choices) return choices.labels ?? choices.values ?? choices

  return null
}

function namedValuesToRecord(values: unknown): Record<string, unknown> {
  if (!Array.isArray(values)) return {}
  const record: Record<string, unknown> = {}
  for (const item of values) {
    if (!item || typeof item !== "object") continue
    const namedValue = item as FilloutNamedValue
    const name = namedValueLabel(namedValue)
    if (!name) continue
    record[name] = answerValue(namedValue)
  }
  return record
}

function questionIdLabels(questions: unknown): Record<string, string> {
  if (!Array.isArray(questions)) return {}
  const labels: Record<string, string> = {}
  for (const item of questions) {
    const question = objectRecord(item)
    if (!question) continue
    const id = asString(question.id ?? question.key)
    const label = asString(question.name ?? question.title ?? question.label)
    if (id && label) labels[id] = label
  }
  return labels
}

function keyedAnswersToRecord(answers: unknown, questions: unknown): Record<string, unknown> {
  const answerRecord = objectRecord(answers)
  if (!answerRecord) return {}

  const labels = questionIdLabels(questions)
  const record: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(answerRecord)) {
    record[labels[key] ?? key] = value
  }
  return record
}

function addRecognizedFields(flat: Record<string, unknown>, record: Record<string, unknown>): void {
  Object.assign(flat, record)
  Object.assign(flat, namedValuesToRecord(record.questions))
  Object.assign(flat, namedValuesToRecord(record.urlParameters))
  Object.assign(flat, namedValuesToRecord(record.url_parameters))
  Object.assign(flat, namedValuesToRecord(record.calculations))
  Object.assign(flat, namedValuesToRecord(record.answers))
  Object.assign(flat, keyedAnswersToRecord(record.answers, record.questions))
}

function flattenPayload(body: unknown): Record<string, unknown> {
  const root = objectRecord(body)
  if (!root) return {}

  const flat: Record<string, unknown> = {}
  addRecognizedFields(flat, root)

  for (const nestKey of ["submission", "data", "application", "payload", "formResponse", "form_response", "response"]) {
    const nested = objectRecord(root[nestKey])
    if (nested) addRecognizedFields(flat, nested)
  }

  return flat
}

function bodyKind(body: unknown): string {
  if (body == null) return "empty"
  if (Array.isArray(body)) return "array"
  return typeof body
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

  const root = objectRecord(body)
  if (root) {
    for (const nestKey of ["submission", "form_response", "formResponse", "response"]) {
      const nested = objectRecord(root[nestKey])
      if (!nested) continue
      const nestedId = asString(nested.submissionId ?? nested.submission_id ?? nested.id ?? nested.token)
      if (nestedId) return nestedId
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
      bodyKind: bodyKind(body),
      acceptedPayloads: ACCEPTED_PAYLOADS,
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
      bodyKind: bodyKind(body),
      acceptedPayloads: ACCEPTED_PAYLOADS,
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
    channelType: pickFromRecord(flat, CHANNEL_TYPE_KEYS) ?? undefined,
    socialMediaLink: pickFromRecord(flat, SOCIAL_MEDIA_KEYS) ?? undefined,
    location: pickFromRecord(flat, LOCATION_KEYS) ?? undefined,
    languages: pickFromRecord(flat, LANGUAGE_KEYS) ?? undefined,
    registrationNumber: pickFromRecord(flat, REGISTRATION_NUMBER_KEYS) ?? undefined,
    role: pickFromRecord(flat, ROLE_KEYS) ?? undefined,
    agreedToTerms: asBoolean(pickFromRecord(flat, AGREE_KEYS)),
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
