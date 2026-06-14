"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { verifyTurnstile } from "@/lib/turnstile"
import { getVolunteerFormRegistry } from "@/lib/site-settings-server"
import { registerVolunteerApplicant } from "@/lib/volunteers"
import { validateAnswers } from "@/lib/form-fields"
import { HONEYPOT_FIELD, TURNSTILE_FIELD, boundString, readAnswersFromFormData, stringAnswer } from "@/lib/form-submit"
import type { VolunteerApplicationPayload } from "@/lib/volunteer-types"

export type SubmitVolunteerResult = { success: true } | { error: string }

/** Public volunteer application submit from the built-in dynamic form (no session). */
export async function submitVolunteerApplication(formData: FormData): Promise<SubmitVolunteerResult> {
  const ip = getClientIp(await headers())
  if (!checkRateLimit(`volunteer-apply:${ip}`, 5).allowed) {
    return { error: "Too many submissions. Please wait a moment." }
  }
  if (formData.get(HONEYPOT_FIELD)) return { error: "Submission rejected" }
  if (!(await verifyTurnstile(formData.get(TURNSTILE_FIELD) as string, ip))) {
    return { error: "Bot verification failed. Please try again." }
  }

  const registry = await getVolunteerFormRegistry()
  const answers = readAnswersFromFormData(registry, formData)

  const validation = validateAnswers(registry, answers)
  if (!validation.ok) {
    return { error: Object.values(validation.errors)[0] ?? "Please complete the required fields." }
  }

  const email = boundString(registry, answers, "email")
  if (!email) return { error: "Email is required." }

  const application: VolunteerApplicationPayload = {
    fields: answers,
    message: stringAnswer(answers, "message") ?? null,
    skills: stringAnswer(answers, "skills") ?? null,
    timezone: stringAnswer(answers, "timezone") ?? null,
    availability: stringAnswer(answers, "availability") ?? null,
  }

  const result = await registerVolunteerApplicant({
    email,
    name: boundString(registry, answers, "name"),
    application,
    source: "in-app",
  })

  if (!result.ok) {
    if (result.status === 409) {
      return { error: "An active account already exists for this email." }
    }
    return { error: result.error }
  }

  revalidatePath("/volunteer")
  revalidatePath("/admin/volunteers")
  return { success: true }
}
