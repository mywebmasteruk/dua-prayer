"use server"

import { headers } from "next/headers"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { createSignedUploadUrl } from "@/lib/application-uploads"
import { getChannelFormRegistry, getVolunteerFormRegistry } from "@/lib/site-settings-server"
import { visibleFields, type FormKind } from "@/lib/form-fields"

export type RequestUploadInput = {
  form: FormKind
  fieldId: string
  filename: string
  contentType: string
  sizeBytes: number
}

export type RequestUploadResult =
  | { ok: true; bucket: string; path: string; token: string }
  | { ok: false; error: string }

/**
 * Mint a short-lived signed upload URL for a file field on a public application
 * form. No session required (the volunteer form is public). The field is looked
 * up in the server-side registry so accept/size limits can't be tampered with.
 */
export async function requestApplicationUpload(input: RequestUploadInput): Promise<RequestUploadResult> {
  const ip = getClientIp(await headers())
  if (!checkRateLimit(`application-upload:${ip}`, 30).allowed) {
    return { ok: false, error: "Too many uploads. Please wait a moment and try again." }
  }

  if (input.form !== "channel" && input.form !== "volunteer") {
    return { ok: false, error: "Unknown form." }
  }

  const registry =
    input.form === "channel" ? await getChannelFormRegistry() : await getVolunteerFormRegistry()
  const field = visibleFields(registry).find((f) => f.id === input.fieldId)

  if (!field || field.type !== "file") {
    return { ok: false, error: "Unknown upload field." }
  }

  return createSignedUploadUrl({
    form: input.form,
    fieldId: field.id,
    filename: input.filename,
    contentType: input.contentType,
    sizeBytes: input.sizeBytes,
    accept: field.fileConfig?.accept,
    maxSizeMb: field.fileConfig?.maxSizeMb,
  })
}
