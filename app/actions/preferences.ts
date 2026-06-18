"use server"

import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { getServerUser } from "@/lib/server-user"

export type UserPreferences = {
  /** Feed language codes the user wants to see (empty = all). */
  languages: string[]
  /** Topic category ids of interest. */
  topics: number[]
  /** Set once the user finishes onboarding; null until then. */
  onboardedAt: string | null
}

const EMPTY_PREFERENCES: UserPreferences = { languages: [], topics: [], onboardedAt: null }

function parsePreferences(raw: unknown): UserPreferences {
  const p = (raw ?? {}) as Record<string, unknown>
  return {
    languages: Array.isArray(p.languages) ? p.languages.filter((x): x is string => typeof x === "string") : [],
    topics: Array.isArray(p.topics) ? p.topics.filter((x): x is number => typeof x === "number") : [],
    onboardedAt: typeof p.onboarded_at === "string" ? p.onboarded_at : null,
  }
}

export async function getMyPreferences(): Promise<UserPreferences> {
  const user = await getServerUser()
  if (!user) return EMPTY_PREFERENCES

  const admin = createAdminSupabaseClient()
  const { data, error } = await admin.from("profiles").select("preferences").eq("id", user.id).maybeSingle()
  if (error || !data) return EMPTY_PREFERENCES
  return parsePreferences(data.preferences)
}

export async function updateMyPreferences(
  patch: Partial<{ languages: string[]; topics: number[]; onboardedAt: string | null }>,
) {
  const user = await getServerUser()
  if (!user) return { error: "Sign in to save preferences." }

  const current = await getMyPreferences()
  const next = {
    languages: patch.languages ?? current.languages,
    topics: patch.topics ?? current.topics,
    onboarded_at: patch.onboardedAt !== undefined ? patch.onboardedAt : current.onboardedAt,
  }

  const admin = createAdminSupabaseClient()
  const { error } = await admin
    .from("profiles")
    .update({ preferences: next, updated_at: new Date().toISOString() })
    .eq("id", user.id)
  if (error) return { error: error.message }
  return { success: true as const }
}
