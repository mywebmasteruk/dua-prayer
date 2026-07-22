"use server"

import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { getServerUser } from "@/lib/server-user"
import { enrichDuas } from "@/app/actions/duas"
import type { Dua } from "@/lib/types/dua"

export async function toggleBookmark(
  duaId: number,
): Promise<{ bookmarked: boolean } | { error: string }> {
  const user = await getServerUser()
  if (!user) return { error: "Sign in to bookmark duas." }

  const admin = createAdminSupabaseClient()

  const { data: existing, error: loadError } = await admin
    .from("bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("dua_id", duaId)
    .maybeSingle()

  if (loadError) return { error: loadError.message }

  if (existing) {
    const { error } = await admin.from("bookmarks").delete().eq("id", existing.id)
    if (error) return { error: error.message }
    revalidatePath("/bookmarks")
    return { bookmarked: false }
  }

  const { error } = await admin.from("bookmarks").insert({ user_id: user.id, dua_id: duaId })
  // Unique-violation = a concurrent insert already bookmarked it; treat as success.
  if (error && error.code !== "23505") return { error: error.message }
  revalidatePath("/bookmarks")
  return { bookmarked: true }
}

export async function listMyBookmarks(): Promise<{ duas: Dua[] } | { error: string }> {
  const user = await getServerUser()
  if (!user) return { error: "Unauthorized" }

  const admin = createAdminSupabaseClient()
  const { data: rows, error } = await admin
    .from("bookmarks")
    .select("dua_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) return { error: error.message }

  const duaIds = (rows ?? []).map((r) => r.dua_id)
  if (duaIds.length === 0) return { duas: [] }

  // Only surface published duas (a dua may have been unpublished after saving).
  const { data: duaRows, error: duaError } = await admin
    .from("duas")
    .select("id, text, user_id, category_id, likes, published, flagged, language, created_at")
    .in("id", duaIds)
    .eq("published", true)

  if (duaError) return { error: duaError.message }

  const enriched = await enrichDuas(duaRows ?? [])
  // Preserve bookmark recency order (the duas query above is unordered).
  const order = new Map(duaIds.map((id, index) => [id, index]))
  enriched.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
  return { duas: enriched }
}
