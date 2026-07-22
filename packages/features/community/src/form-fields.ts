// Shared, pure field-registry contract for the admin-managed application forms.
// Imported by both client (form renderer, builder) and server (storage, submit).
// MUST stay free of server-only imports.

export const FORM_FIELD_TYPES = [
  "text",
  "email",
  "url",
  "tel",
  "textarea",
  "select",
  "multiselect",
  "checkbox",
  "radio",
  "file",
] as const

export type FormFieldType = (typeof FORM_FIELD_TYPES)[number]

/** Which form a registry drives. */
export type FormKind = "channel" | "volunteer"

/**
 * System bindings map an answer to a real column / registration argument.
 * "none" = the answer is stored only inside the JSONB `fields` map.
 */
export const CHANNEL_SYSTEM_BINDINGS = [
  "none",
  "channelName",
  "applicantName",
  "email",
  "handle",
  "description",
] as const
export type ChannelSystemBinding = (typeof CHANNEL_SYSTEM_BINDINGS)[number]

export const VOLUNTEER_SYSTEM_BINDINGS = ["none", "email", "name"] as const
export type VolunteerSystemBinding = (typeof VOLUNTEER_SYSTEM_BINDINGS)[number]

/** Bindings that the app logic depends on and that must never be deleted/disabled. */
export const REQUIRED_CHANNEL_BINDINGS: ChannelSystemBinding[] = ["email", "channelName", "description"]
export const REQUIRED_VOLUNTEER_BINDINGS: VolunteerSystemBinding[] = ["email"]

export type FormFieldOption = { value: string; label: string }

/** Conditional visibility: show the field only when another field's answer is in `in`. */
export type FieldVisibleWhen = { field: string; in: string[] }

export type FormFileConfig = {
  accept?: string[] // e.g. ["image/png", "image/jpeg", "application/pdf"]
  maxSizeMb?: number
}

export type FormFieldDefinition = {
  /** Stable id — the JSONB answer key. Never reuse an id for a different field. */
  id: string
  /** Human-readable slug (display/debug only; `id` is canonical). */
  key: string
  label: string
  type: FormFieldType
  required: boolean
  enabled: boolean
  showInReview: boolean
  order: number
  placeholder?: string
  helpText?: string
  options?: FormFieldOption[]
  systemBinding?: string
  fileConfig?: FormFileConfig
  visibleWhen?: FieldVisibleWhen
}

export type FormRegistry = {
  version: 1
  fields: FormFieldDefinition[]
}

/** A stored file answer (we keep the storage object path, never a long-lived URL). */
export type FormFileAnswer = {
  path: string
  name: string
  size: number
  type: string
}

export type FormAnswerValue = string | string[] | boolean | FormFileAnswer

export function isFileAnswer(value: unknown): value is FormFileAnswer {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof (value as FormFileAnswer).path === "string"
  )
}

// --- parsing / serialization -------------------------------------------------

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback
}

function parseOptions(value: unknown): FormFieldOption[] | undefined {
  if (!Array.isArray(value)) return undefined
  const options: FormFieldOption[] = []
  for (const item of value) {
    if (!item || typeof item !== "object") continue
    const record = item as Record<string, unknown>
    const optionValue = asString(record.value)
    const label = asString(record.label) ?? optionValue
    if (optionValue) options.push({ value: optionValue, label: label ?? optionValue })
  }
  return options.length > 0 ? options : undefined
}

function parseVisibleWhen(value: unknown): FieldVisibleWhen | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined
  const record = value as Record<string, unknown>
  const field = asString(record.field)
  const values = Array.isArray(record.in)
    ? (record.in.filter((entry) => typeof entry === "string") as string[])
    : []
  if (!field || values.length === 0) return undefined
  return { field, in: values }
}

function parseFileConfig(value: unknown): FormFileConfig | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined
  const record = value as Record<string, unknown>
  const accept = Array.isArray(record.accept)
    ? (record.accept.filter((entry) => typeof entry === "string") as string[])
    : undefined
  const maxSizeMb = typeof record.maxSizeMb === "number" ? record.maxSizeMb : undefined
  const config: FormFileConfig = {}
  if (accept && accept.length > 0) config.accept = accept
  if (maxSizeMb && maxSizeMb > 0) config.maxSizeMb = maxSizeMb
  return Object.keys(config).length > 0 ? config : undefined
}

function parseField(value: unknown, index: number): FormFieldDefinition | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const id = asString(record.id)
  const label = asString(record.label)
  const type = asString(record.type) as FormFieldType | undefined
  if (!id || !label || !type || !FORM_FIELD_TYPES.includes(type)) return null

  return {
    id,
    key: asString(record.key) ?? id,
    label,
    type,
    required: asBoolean(record.required, false),
    enabled: asBoolean(record.enabled, true),
    showInReview: asBoolean(record.showInReview, true),
    order: typeof record.order === "number" ? record.order : index,
    placeholder: asString(record.placeholder),
    helpText: asString(record.helpText),
    options: parseOptions(record.options),
    systemBinding: asString(record.systemBinding),
    fileConfig: parseFileConfig(record.fileConfig),
    visibleWhen: parseVisibleWhen(record.visibleWhen),
  }
}

/**
 * Defensive parse of a stored registry string. Returns `fallback` on any failure,
 * drops malformed fields, and sorts by `order`. Mirrors lib parse helpers' style.
 */
export function parseFormRegistry(raw: string | null | undefined, fallback: FormRegistry): FormRegistry {
  if (!raw || !raw.trim()) return fallback
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return fallback
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return fallback
  const fieldsRaw = (parsed as Record<string, unknown>).fields
  if (!Array.isArray(fieldsRaw)) return fallback

  const fields = fieldsRaw
    .map((field, index) => parseField(field, index))
    .filter((field): field is FormFieldDefinition => field !== null)
    .sort((a, b) => a.order - b.order)

  if (fields.length === 0) return fallback
  return { version: 1, fields }
}

export function serializeFormRegistry(registry: FormRegistry): string {
  return JSON.stringify({ version: 1, fields: registry.fields })
}

/** Enabled fields in display order. */
export function visibleFields(registry: FormRegistry): FormFieldDefinition[] {
  return registry.fields.filter((field) => field.enabled).sort((a, b) => a.order - b.order)
}

/** Whether a field's `visibleWhen` condition is satisfied by the current answers. */
export function isFieldVisible(
  field: FormFieldDefinition,
  answers: Record<string, FormAnswerValue | undefined>,
): boolean {
  if (!field.visibleWhen) return true
  const current = answers[field.visibleWhen.field]
  // Coerce a controlling checkbox's boolean to "true"/"false" so a details field
  // can depend on a ticked checkbox via `in: ["true"]`.
  const normalized = typeof current === "boolean" ? (current ? "true" : "false") : current
  return typeof normalized === "string" && field.visibleWhen.in.includes(normalized)
}

// --- validation --------------------------------------------------------------

function isEmptyAnswer(field: FormFieldDefinition, value: FormAnswerValue | undefined): boolean {
  if (value === undefined || value === null) return true
  if (field.type === "checkbox") return value !== true
  if (field.type === "file") return !isFileAnswer(value)
  if (field.type === "multiselect") return !Array.isArray(value) || value.length === 0
  if (Array.isArray(value)) return value.length === 0
  return String(value).trim().length === 0
}

export type AnswerValidation = { ok: true } | { ok: false; errors: Record<string, string> }

/** Shared by the client (pre-submit) and the server. Checks required/enabled fields only. */
export function validateAnswers(
  registry: FormRegistry,
  answers: Record<string, FormAnswerValue | undefined>,
): AnswerValidation {
  const errors: Record<string, string> = {}
  for (const field of visibleFields(registry)) {
    if (!isFieldVisible(field, answers)) continue
    // File uploads are not wired in the Makerkit MVP renderer yet.
    if (field.type === "file") continue
    if (field.required && isEmptyAnswer(field, answers[field.id])) {
      errors[field.id] = `${field.label} is required.`
    }
  }
  return Object.keys(errors).length === 0 ? { ok: true } : { ok: false, errors }
}

/** First field bound to the given system binding (enabled only). */
export function fieldForBinding(
  registry: FormRegistry,
  binding: string,
): FormFieldDefinition | undefined {
  return visibleFields(registry).find((field) => field.systemBinding === binding)
}

// --- defaults ----------------------------------------------------------------

// Common UTC-offset timezone options for the volunteer form. Value is a stable
// offset string; label adds a representative region for clarity.
export const TIMEZONE_OPTIONS: FormFieldOption[] = [
  { value: "UTC-12:00", label: "UTC−12:00" },
  { value: "UTC-11:00", label: "UTC−11:00" },
  { value: "UTC-10:00", label: "UTC−10:00 (Hawaii)" },
  { value: "UTC-09:00", label: "UTC−09:00 (Alaska)" },
  { value: "UTC-08:00", label: "UTC−08:00 (US Pacific)" },
  { value: "UTC-07:00", label: "UTC−07:00 (US Mountain)" },
  { value: "UTC-06:00", label: "UTC−06:00 (US Central)" },
  { value: "UTC-05:00", label: "UTC−05:00 (US Eastern)" },
  { value: "UTC-04:00", label: "UTC−04:00 (Atlantic)" },
  { value: "UTC-03:00", label: "UTC−03:00 (Brazil / Argentina)" },
  { value: "UTC-02:00", label: "UTC−02:00" },
  { value: "UTC-01:00", label: "UTC−01:00 (Cape Verde)" },
  { value: "UTC+00:00", label: "UTC+00:00 (London / Lisbon)" },
  { value: "UTC+01:00", label: "UTC+01:00 (Central Europe / West Africa)" },
  { value: "UTC+02:00", label: "UTC+02:00 (Cairo / Johannesburg)" },
  { value: "UTC+03:00", label: "UTC+03:00 (Istanbul / Riyadh / Moscow)" },
  { value: "UTC+03:30", label: "UTC+03:30 (Tehran)" },
  { value: "UTC+04:00", label: "UTC+04:00 (Dubai)" },
  { value: "UTC+04:30", label: "UTC+04:30 (Kabul)" },
  { value: "UTC+05:00", label: "UTC+05:00 (Pakistan)" },
  { value: "UTC+05:30", label: "UTC+05:30 (India / Sri Lanka)" },
  { value: "UTC+06:00", label: "UTC+06:00 (Bangladesh)" },
  { value: "UTC+07:00", label: "UTC+07:00 (Jakarta / Bangkok)" },
  { value: "UTC+08:00", label: "UTC+08:00 (China / Singapore / Malaysia)" },
  { value: "UTC+09:00", label: "UTC+09:00 (Japan / Korea)" },
  { value: "UTC+10:00", label: "UTC+10:00 (Sydney)" },
  { value: "UTC+11:00", label: "UTC+11:00" },
  { value: "UTC+12:00", label: "UTC+12:00 (New Zealand)" },
  { value: "UTC+13:00", label: "UTC+13:00" },
  { value: "UTC+14:00", label: "UTC+14:00" },
]

function field(def: Partial<FormFieldDefinition> & Pick<FormFieldDefinition, "id" | "label" | "type" | "order">): FormFieldDefinition {
  return {
    key: def.id,
    required: false,
    enabled: true,
    showInReview: true,
    ...def,
  }
}

export const DEFAULT_CHANNEL_REGISTRY: FormRegistry = {
  version: 1,
  fields: [
    field({ id: "channel_name", label: "Channel name", type: "text", order: 10, required: true, systemBinding: "channelName", placeholder: "e.g. Masjid Al-Noor" }),
    field({ id: "your_name", label: "Your name", type: "text", order: 20, systemBinding: "applicantName", placeholder: "Imam Yusuf" }),
    field({ id: "email", label: "Email", type: "email", order: 30, required: true, systemBinding: "email" }),
    field({ id: "handle", label: "Channel handle", type: "text", order: 40, systemBinding: "handle", helpText: "Short slug, e.g. alnoor. Auto-generated if left blank." }),
    field({ id: "description", label: "Description", type: "textarea", order: 50, required: true, systemBinding: "description" }),
    field({ id: "organization", label: "Organization", type: "text", order: 60 }),
    field({ id: "website", label: "Website", type: "url", order: 70 }),
    field({
      id: "channel_type",
      label: "Channel type",
      type: "select",
      order: 80,
      options: [
        { value: "masjid", label: "Masjid" },
        { value: "organization", label: "Organization" },
        { value: "individual", label: "Individual" },
      ],
    }),
    field({
      id: "role",
      label: "Your role",
      type: "select",
      order: 90,
      options: [
        { value: "imam", label: "Imam / Religious leader" },
        { value: "influencer", label: "Influencer / Public Figure" },
        { value: "individual", label: "Private Individual" },
        { value: "other", label: "Other" },
      ],
    }),
    field({ id: "location", label: "Country / location", type: "text", order: 100 }),
    field({
      id: "languages",
      label: "Primary posting language",
      type: "select",
      order: 110,
      options: [
        { value: "en", label: "English" },
        { value: "ar", label: "Arabic" },
        { value: "ur", label: "Urdu" },
        { value: "fr", label: "French" },
        { value: "es", label: "Spanish" },
        { value: "other", label: "Other" },
      ],
    }),
    field({ id: "social_media_link", label: "Social media profile", type: "url", order: 120 }),
    field({
      id: "registration_number",
      label: "Legal entity / registration no.",
      type: "text",
      order: 130,
      visibleWhen: { field: "channel_type", in: ["masjid", "organization"] },
    }),
    field({
      id: "registration_document",
      label: "Registration document",
      type: "file",
      order: 140,
      required: true,
      fileConfig: { accept: ["application/pdf", "image/png", "image/jpeg"], maxSizeMb: 10 },
      visibleWhen: { field: "channel_type", in: ["masjid", "organization"] },
    }),
    field({
      id: "channel_logo",
      label: "Channel logo",
      type: "file",
      order: 150,
      fileConfig: { accept: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"], maxSizeMb: 5 },
    }),
    field({ id: "message", label: "Message / notes", type: "textarea", order: 160 }),
    field({ id: "agree_terms", label: "I agree to follow the platform Terms & Conditions", type: "checkbox", order: 170, required: true, showInReview: true }),
  ],
}

export const DEFAULT_VOLUNTEER_REGISTRY: FormRegistry = {
  version: 1,
  fields: [
    field({ id: "name", label: "Name", type: "text", order: 10, systemBinding: "name" }),
    field({ id: "email", label: "Email", type: "email", order: 20, required: true, systemBinding: "email" }),
    field({
      id: "skills",
      label: "Skills / area of support",
      type: "multiselect",
      order: 30,
      options: [
        { value: "marketing_social", label: "Marketing — Social media" },
        { value: "marketing_email", label: "Marketing — Email marketing" },
        { value: "marketing_seo", label: "Marketing — SEO" },
        { value: "marketing_ads", label: "Marketing — Paid ads / PPC" },
        { value: "marketing_growth", label: "Marketing — Growth / analytics" },
        { value: "marketing_brand", label: "Marketing — Brand / strategy" },
        { value: "content_copywriting", label: "Content — Copywriting" },
        { value: "content_writing", label: "Content — Writing / blogging" },
        { value: "content_graphic", label: "Content — Graphic design" },
        { value: "content_video", label: "Content — Video / motion" },
        { value: "content_translation", label: "Content — Translation" },
        { value: "content_community", label: "Content — Community management" },
        { value: "dev_frontend", label: "Development — Frontend" },
        { value: "dev_backend", label: "Development — Backend" },
        { value: "dev_fullstack", label: "Development — Full-stack" },
        { value: "dev_mobile", label: "Development — Mobile" },
        { value: "dev_devops", label: "Development — DevOps / infrastructure" },
        { value: "dev_qa", label: "Development — QA / testing" },
        { value: "dev_security", label: "Development — Security" },
        { value: "dev_data", label: "Development — Data / databases" },
        { value: "religion_imam", label: "Religion — Qualified Imam" },
        { value: "religion_fiqh", label: "Religion — Islamic Fiqh (jurisprudence)" },
        { value: "religion_quran_tafsir", label: "Religion — Qur'an & Tafsir" },
        { value: "religion_hadith", label: "Religion — Hadith sciences" },
        { value: "religion_aqeedah", label: "Religion — Aqeedah (creed)" },
        { value: "religion_arabic", label: "Religion — Classical Arabic" },
        { value: "other", label: "Other (describe in additional info)" },
      ],
    }),
    field({
      id: "timezone",
      label: "Location / Timezone",
      type: "select",
      order: 40,
      options: TIMEZONE_OPTIONS,
    }),
    field({
      id: "moderation_experience",
      label: "Do you have prior experience with content moderation?",
      type: "radio",
      order: 50,
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
    }),
    field({
      id: "moderation_experience_details",
      label: "Please provide details",
      type: "textarea",
      order: 55,
      placeholder: "Where, what kind of content, how long, and any tools you used.",
      visibleWhen: { field: "moderation_experience", in: ["yes"] },
    }),
    field({
      id: "availability",
      label: "Availability",
      type: "multiselect",
      order: 60,
      options: [
        { value: "weekday_mornings", label: "Weekday mornings" },
        { value: "weekday_afternoons", label: "Weekday afternoons" },
        { value: "weekday_evenings", label: "Weekday evenings" },
        { value: "weekends", label: "Weekends" },
        { value: "flexible", label: "Flexible / anytime" },
        { value: "few_hours_week", label: "A few hours per week" },
        { value: "on_call", label: "On-call / as needed" },
      ],
    }),
    field({
      id: "social_media",
      label: "Social media profile",
      type: "url",
      order: 65,
      placeholder: "https://… (LinkedIn, X/Twitter, Instagram, etc.)",
    }),
    field({
      id: "message",
      label: "Additional information",
      type: "textarea",
      order: 70,
      placeholder: "Tell us about yourself, your profile, and relevant experience — anything you'd like us to know.",
      helpText: "Share a short intro, links to your profile/portfolio, and your experience.",
    }),
    field({
      id: "cv",
      label: "CV / résumé",
      type: "file",
      order: 80,
      fileConfig: { accept: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"], maxSizeMb: 10 },
    }),
  ],
}

export function defaultRegistryFor(kind: FormKind): FormRegistry {
  return kind === "channel" ? DEFAULT_CHANNEL_REGISTRY : DEFAULT_VOLUNTEER_REGISTRY
}
