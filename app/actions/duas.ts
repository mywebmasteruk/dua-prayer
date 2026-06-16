"use server"

import { headers, cookies } from "next/headers"
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { requireAdmin, requirePermission } from "@/lib/auth"
import { getServerUser } from "@/lib/server-user"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { verifyTurnstile } from "@/lib/turnstile"
import { randomBytes } from "crypto"
import { isMissingColumnError } from "@/lib/db-errors"
import { evaluateDuaModeration, fetchAiModerationSettings } from "@/lib/ai-moderation"
import { getPostingMode, shouldAllowPublicDuaSubmission, shouldHoldSubmissionForReview } from "@/lib/posting-settings"
import { detectLanguage } from "@/lib/detect-language"
import { extractHashtags } from "@/lib/hashtags"
import type { Category, Dua } from "@/lib/types/dua"

const PAGE_SIZE = 10
const FEED_BATCH_SIZE = 100

async function getVoterHash(): Promise<string> {
  const cookieStore = await cookies()
  const existing = cookieStore.get("dua_voter")?.value
  if (existing && existing.length >= 16) return existing

  const hash = randomBytes(24).toString("hex")
  cookieStore.set("dua_voter", hash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  })
  return hash
}

export async function getDuas(options: { category?: string; page?: number } = {}) {
  const supabase = await createServerSupabaseClient()
  const page = Math.max(1, options.page ?? 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from("duas")
    .select("id, text, user_id, category_id, likes, created_at, published, flagged, language", { count: "exact" })
    .eq("published", true)
    .order("created_at", { ascending: false })
    .range(from, to)

  if (options.category && options.category !== "all") {
    const categoryId = Number.parseInt(options.category, 10)
    // A non-numeric category would send NaN to PostgREST and fail the query.
    if (Number.isInteger(categoryId)) {
      query = query.eq("category_id", categoryId)
    }
  }

  const { data: duas, error, count } = await query
  if (error) {
    console.error("Error fetching duas:", error)
    return { duas: [], total: 0, page, pageSize: PAGE_SIZE }
  }

  return {
    duas: await enrichDuas(duas ?? []),
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  }
}

// Hashtag suggestions for the composer's "#" autocomplete. Aggregates hashtags
// from recent published duas, ranked by frequency, filtered by the typed prefix.
export async function searchHashtags(query: string): Promise<string[]> {
  const prefix = query.trim().toLowerCase().replace(/^#+/, "")
  const admin = createAdminSupabaseClient()
  const { data } = await admin
    .from("duas")
    .select("text")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(500)

  const counts = new Map<string, number>()
  for (const row of data ?? []) {
    for (const hashtag of extractHashtags(row.text as string)) {
      counts.set(hashtag.tag, (counts.get(hashtag.tag) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .filter(([tag]) => (prefix ? tag.startsWith(prefix) : true))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([tag]) => tag)
}

export async function getAdminDuas(filters: { search?: string; status?: string; category?: string; language?: string }) {
  const gate = await requirePermission("manage_duas")
  if (!gate.ok) return []

  const admin = createAdminSupabaseClient()
  let query = admin
    .from("duas")
    .select("id, text, user_id, category_id, likes, created_at, published, flagged, language")
    .order("created_at", { ascending: false })

  if (filters.search) query = query.ilike("text", `%${filters.search}%`)
  if (filters.status === "published") query = query.eq("published", true)
  else if (filters.status === "unpublished") query = query.eq("published", false)
  else if (filters.status === "flagged") query = query.eq("flagged", true)
  if (filters.category && filters.category !== "all") {
    query = query.eq("category_id", Number.parseInt(filters.category))
  }
  if (filters.language && filters.language !== "all") {
    query = query.eq("language", filters.language)
  }

  const { data: duas, error } = await query
  if (error) {
    console.error("Error fetching admin duas:", error)
    return []
  }

  const { data: categories } = await admin.from("categories").select("id, name")
  const categoryMap = new Map(categories?.map((c) => [c.id, c.name]) ?? [])

  return (duas ?? []).map((dua) => ({
    ...dua,
    category_name: dua.category_id ? categoryMap.get(dua.category_id) : undefined,
  }))
}

function normalizeCategoryRow(row: {
  id: number
  name: string
  description?: string | null
  is_active?: boolean | null
  sort_order?: number | null
  channel_type?: string | null
  status?: string | null
  owner_id?: string | null
  handle?: string | null
  is_verified?: boolean | null
  verified_at?: string | null
  reviewed_at?: string | null
  reviewed_by?: string | null
  created_at?: string
  updated_at?: string
}): Category {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    is_active: row.is_active ?? true,
    sort_order: row.sort_order ?? 0,
    channel_type: row.channel_type === "user" ? "user" : "category",
    status:
      row.status === "pending_review" || row.status === "rejected" ? row.status : "approved",
    owner_id: row.owner_id ?? null,
    handle: row.handle ?? null,
    is_verified: row.is_verified ?? row.channel_type !== "user",
    verified_at: row.verified_at ?? null,
    reviewed_at: row.reviewed_at ?? null,
    reviewed_by: row.reviewed_by ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

const CATEGORY_SELECT =
  "id, name, description, is_active, sort_order, channel_type, status, owner_id, handle, is_verified, verified_at, reviewed_at, reviewed_by, created_at, updated_at"

async function fetchCategoriesFromDb(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  options: { includeInactive?: boolean; includeUnapproved?: boolean } = {},
): Promise<Category[]> {
  let query = supabase
    .from("categories")
    .select(CATEGORY_SELECT)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })

  if (!options.includeInactive) {
    query = query.eq("is_active", true)
  }

  if (!options.includeUnapproved) {
    query = query.eq("status", "approved")
  }

  const { data, error } = await query
  if (!error) {
    return (data ?? []).map(normalizeCategoryRow)
  }

  if (!isMissingColumnError(error)) {
    console.error("Error fetching categories:", error)
    return []
  }

  let legacyQuery = supabase
    .from("categories")
    .select("id, name, description, is_active, sort_order, created_at, updated_at")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })

  if (!options.includeInactive) {
    legacyQuery = legacyQuery.eq("is_active", true)
  }

  const { data: legacy, error: legacyError } = await legacyQuery
  if (legacyError) {
    console.error("Error fetching categories:", legacyError)
    return []
  }

  return (legacy ?? []).map(normalizeCategoryRow)
}

export async function getCategories(options: { includeInactive?: boolean } = {}) {
  const supabase = await createServerSupabaseClient()
  return fetchCategoriesFromDb(supabase, options)
}

/** Category id → label/type lookup shared by every feed render. */
const getCachedCategoryLabels = unstable_cache(
  async () => {
    const admin = createAdminSupabaseClient()
    const { data, error } = await admin.from("categories").select("id, name, channel_type")
    if (error) {
      console.error("Error fetching category labels:", error)
      return []
    }
    return data ?? []
  },
  ["category-labels"],
  { revalidate: 60, tags: ["categories"] },
)

async function enrichDuas(
  duas: Array<{
    id: number
    text: string
    user_id: string | null
    category_id: number | null
    likes: number
    created_at: string
    published: boolean
    flagged: boolean
    language?: string | null
  }>,
): Promise<Dua[]> {
  const supabase = await createServerSupabaseClient()
  const duaIds = duas.map((dua) => dua.id)
  const botGeneratedIds = new Set<number>()

  const [categories, botPostsResult, user] = await Promise.all([
    getCachedCategoryLabels(),
    duaIds.length > 0
      ? createAdminSupabaseClient().from("dua_bot_event_posts").select("dua_id").in("dua_id", duaIds)
      : Promise.resolve(null),
    getServerUser(),
  ])
  const categoryMap = new Map(categories?.map((c) => [c.id, c]) ?? [])

  if (botPostsResult) {
    if (botPostsResult.error) {
      console.error("Error fetching bot-generated dua markers:", botPostsResult.error)
    } else {
      for (const post of botPostsResult.data ?? []) {
        if (typeof post.dua_id === "number") botGeneratedIds.add(post.dua_id)
      }
    }
  }

  // Which of these duas the current (logged-in) user has flagged.
  let flaggedByMe = new Set<number>()
  if (user && duaIds.length > 0) {
    const { data: flags } = await createAdminSupabaseClient()
      .from("dua_flags")
      .select("dua_id")
      .eq("user_id", user.id)
      .in("dua_id", duaIds)
    flaggedByMe = new Set(flags?.map((f) => f.dua_id) ?? [])
  }

  let prayedIds = new Set<number>()
  if (duaIds.length > 0) {
    if (user) {
      const { data: prayers } = await supabase
        .from("dua_prayers")
        .select("dua_id")
        .eq("user_id", user.id)
        .in("dua_id", duaIds)
      prayedIds = new Set(prayers?.map((p) => p.dua_id) ?? [])
    } else {
      const voterHash = (await cookies()).get("dua_voter")?.value
      if (voterHash) {
        const admin = createAdminSupabaseClient()
        const { data: prayers } = await admin
          .from("dua_prayers")
          .select("dua_id")
          .eq("voter_hash", voterHash)
          .in("dua_id", duaIds)
        prayedIds = new Set(prayers?.map((p) => p.dua_id) ?? [])
      }
    }
  }

  return duas.map((dua) => {
    const category = dua.category_id ? categoryMap.get(dua.category_id) : undefined

    return {
      ...dua,
      category_name: category?.name,
      category_channel_type: category?.channel_type === "user" ? "user" : "category",
      is_bot_generated: botGeneratedIds.has(dua.id),
      user_has_prayed: prayedIds.has(dua.id),
      user_has_flagged: flaggedByMe.has(dua.id),
    }
  })
}

/** Count published duas newer than the feed watermark (matches getFeedDuas sort: created_at DESC). */
export async function countNewDuasSince(sinceCreatedAt: string | null) {
  if (!sinceCreatedAt) return 0

  const supabase = await createServerSupabaseClient()
  const { count, error } = await supabase
    .from("duas")
    .select("id", { count: "exact", head: true })
    .eq("published", true)
    .gt("created_at", sinceCreatedAt)

  if (error) {
    console.error("Error counting new duas:", error)
    return 0
  }

  return count ?? 0
}

/**
 * Fetch one batch of the published feed, newest first. The client loads
 * further batches on demand (paging past loaded data or filtering), so duas
 * beyond the first batch stay reachable. Inserts between batch fetches can
 * shift offsets slightly; the client dedupes by id.
 */
/**
 * Shared (non-user-specific) feed batch, cached for all visitors. Uses the
 * admin client because unstable_cache cannot read request cookies; the query
 * only returns published duas, matching public RLS. Invalidated via the
 * "duas-feed" tag on create/moderation; falls back to 30s staleness for
 * likes counts.
 */
const getCachedFeedBatch = unstable_cache(
  async (offset: number) => {
    const admin = createAdminSupabaseClient()
    const { data: duas, error, count } = await admin
      .from("duas")
      .select("id, text, user_id, category_id, likes, created_at, published, flagged, language", { count: "exact" })
      .eq("published", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + FEED_BATCH_SIZE - 1)

    if (error) {
      console.error("Error fetching feed duas:", error)
      return { duas: [], total: 0 }
    }
    return { duas: duas ?? [], total: count ?? 0 }
  },
  ["feed-batch"],
  { revalidate: 30, tags: ["duas-feed"] },
)

export async function getFeedDuas(options: { offset?: number } = {}) {
  const offset = Math.max(0, Math.trunc(options.offset ?? 0))
  const { duas, total } = await getCachedFeedBatch(offset)

  return {
    duas: await enrichDuas(duas),
    total,
    pageSize: PAGE_SIZE,
  }
}

export async function getTopCategories(limit = 3) {
  const supabase = await createServerSupabaseClient()
  const [{ data: categoryCounts, error: countsError }, categories] = await Promise.all([
    supabase.rpc("dua_category_counts"),
    fetchCategoriesFromDb(supabase),
  ])

  if (countsError) console.error("Error fetching category usage:", countsError)

  const counts = new Map<number, number>()
  for (const row of (categoryCounts ?? []) as Array<{ category_id: number; dua_count: number }>) {
    counts.set(Number(row.category_id), Number(row.dua_count))
  }

  return categories
    .map((category) => ({
      ...category,
      duaCount: counts.get(category.id) ?? 0,
    }))
    .sort((a, b) => b.duaCount - a.duaCount || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map(({ duaCount: _duaCount, ...category }) => category)
}

export async function createDua(formData: FormData) {
  const headersList = await headers()
  const ip = getClientIp(headersList)
  const rate = checkRateLimit(`create:${ip}`, 5)
  if (!rate.allowed) {
    return { error: "Too many submissions. Please wait a moment." }
  }

  const honeypot = formData.get("website") as string
  if (honeypot) return { error: "Submission rejected" }

  const turnstileOk = await verifyTurnstile(formData.get("cf-turnstile-response") as string, ip)
  if (!turnstileOk) return { error: "Bot verification failed. Please try again." }

  const text = (formData.get("text") as string)?.trim()
  const categoryId = formData.get("category_id") as string

  if (!text || text.length < 15) return { error: "Dua must be at least 15 characters" }
  if (text.length > 1200) return { error: "Dua must be 1200 characters or less" }

  const user = await getServerUser()
  const { isAdmin } = user ? await requireAdmin() : { isAdmin: false }
  const postingMode = await getPostingMode()
  const postingAccess = shouldAllowPublicDuaSubmission({
    mode: postingMode,
    isAuthenticated: Boolean(user),
    isAdmin,
  })
  if (!postingAccess.allowed) return { error: postingAccess.error }
  const holdForReview = shouldHoldSubmissionForReview({
    mode: postingMode,
    isAuthenticated: Boolean(user),
    isAdmin,
  })

  const admin = createAdminSupabaseClient()

  // The insert uses the service-role client (anonymous submissions bypass
  // RLS), so the client-supplied category must be validated against active
  // public categories — otherwise crafted requests could post into pending,
  // rejected, or inactive channels.
  let validatedCategoryId: number | null = null
  if (categoryId) {
    const parsed = Number.parseInt(categoryId, 10)
    if (!Number.isInteger(parsed)) return { error: "Choose a valid category" }

    const activeCategories = await getCategories()
    if (!activeCategories.some((category) => category.id === parsed)) {
      return { error: "Choose a valid category" }
    }
    validatedCategoryId = parsed
  }

  const moderation = await evaluateDuaModeration({
    text,
    settings: await fetchAiModerationSettings(),
  })

  if (moderation.severity === "block") {
    return { error: "This dua could not be submitted because it appears to violate our community guidelines." }
  }

  const requiresReview = holdForReview || moderation.flagged || moderation.severity === "review"
  const { error } = await admin.from("duas").insert({
    text,
    category_id: validatedCategoryId,
    published: !requiresReview,
    flagged: requiresReview,
    user_id: user?.id ?? null,
    language: detectLanguage(text),
  })

  if (error) {
    console.error("Error creating dua:", error)
    return { error: error.message }
  }

  revalidateTag("duas-feed")
  revalidatePath("/")
  revalidatePath("/admin")
  if (requiresReview) {
    return { success: true, message: "Your dua was received and is waiting for moderator review." }
  }
  return { success: true }
}

export async function prayForDua(duaId: number) {
  const headersList = await headers()
  const ip = getClientIp(headersList)
  const rate = checkRateLimit(`pray:${ip}`, 30)
  if (!rate.allowed) return { error: "Too many requests. Please slow down." }

  const supabase = await createServerSupabaseClient()
  const user = await getServerUser()
  const voterHash = user ? null : await getVoterHash()

  const { data, error } = await supabase.rpc("pray_for_dua", {
    p_dua_id: duaId,
    p_voter_hash: voterHash,
  })

  if (error) {
    console.error("Error praying:", error)
    return { error: "Could not record your prayer" }
  }

  const result = data as { success?: boolean; counted?: boolean; likes?: number; error?: string }
  if (!result.success) {
    return { error: result.error === "not_found" ? "Dua not found" : "Could not pray for this dua" }
  }

  // No feed-cache bust here: invalidating on every ameen would defeat the
  // cache. The client updates optimistically; cached likes lag <=30s.
  revalidatePath("/")
  return { success: true, counted: result.counted, likes: result.likes }
}

// Flagging requires login so a flag can be attributed to a user (only its author
// can later remove it). Records a per-user flag and marks the dua for review.
export async function flagDua(duaId: number) {
  const user = await getServerUser()
  if (!user) return { error: "Please sign in to flag a dua.", requiresAuth: true as const }

  const rate = checkRateLimit(`flag:${user.id}`, 30)
  if (!rate.allowed) return { error: "Too many flags. Please wait." }

  const admin = createAdminSupabaseClient()
  // Only published duas can be flagged.
  const { data: dua, error: lookupError } = await admin
    .from("duas")
    .select("id")
    .eq("id", duaId)
    .eq("published", true)
    .maybeSingle()
  if (lookupError) {
    console.error("Error flagging:", lookupError)
    return { error: "Could not flag this dua" }
  }
  if (!dua) return { error: "Dua not found" }

  const { error: flagError } = await admin
    .from("dua_flags")
    .upsert({ dua_id: duaId, user_id: user.id }, { onConflict: "dua_id,user_id" })
  if (flagError) {
    console.error("Error flagging:", flagError)
    return { error: "Could not flag this dua" }
  }

  await admin.from("duas").update({ flagged: true }).eq("id", duaId)
  revalidatePath("/admin")
  return { success: true }
}

// A registered user removes only their OWN flag; the dua stays flagged for review
// if anyone else has also flagged it.
export async function unflagMyFlag(duaId: number) {
  const user = await getServerUser()
  if (!user) return { error: "Please sign in.", requiresAuth: true as const }

  const admin = createAdminSupabaseClient()
  const { error } = await admin.from("dua_flags").delete().eq("dua_id", duaId).eq("user_id", user.id)
  if (error) return { error: "Could not remove your flag" }

  const { count } = await admin
    .from("dua_flags")
    .select("id", { count: "exact", head: true })
    .eq("dua_id", duaId)
  if ((count ?? 0) === 0) {
    await admin.from("duas").update({ flagged: false }).eq("id", duaId)
  }

  revalidatePath("/admin")
  return { success: true }
}

export async function updateDuaStatus(id: number, published: boolean) {
  const gate = await requirePermission("manage_duas")
  if (!gate.ok) return { error: "Unauthorized" }

  const admin = createAdminSupabaseClient()
  const { error } = await admin.from("duas").update({ published }).eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/admin")
  revalidateTag("duas-feed")
  revalidatePath("/")
  return { success: true }
}

// Admin override: clears the dua's flagged state and ALL users' flags on it.
export async function unflagDua(id: number) {
  const gate = await requirePermission("manage_duas")
  if (!gate.ok) return { error: "Unauthorized" }

  const admin = createAdminSupabaseClient()
  await admin.from("dua_flags").delete().eq("dua_id", id)
  const { error } = await admin.from("duas").update({ flagged: false }).eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/admin")
  return { success: true }
}

export async function updateDua(
  id: number,
  text: string,
  categoryId: number | null,
  language?: string | null,
) {
  const gate = await requirePermission("manage_duas")
  if (!gate.ok) return { error: "Unauthorized" }

  const trimmed = text?.trim()
  if (!trimmed || trimmed.length < 15) return { error: "Dua must be at least 15 characters" }
  if (trimmed.length > 1200) return { error: "Dua must be 1200 characters or less" }

  const admin = createAdminSupabaseClient()
  const update: { text: string; category_id: number | null; language?: string | null } = {
    text: trimmed,
    category_id: categoryId,
  }
  if (language !== undefined) update.language = language?.trim() || null
  const { error } = await admin.from("duas").update(update).eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/admin")
  revalidateTag("duas-feed")
  revalidatePath("/")
  return { success: true }
}

export async function deleteDua(id: number) {
  const gate = await requirePermission("manage_duas")
  if (!gate.ok) return { error: "Unauthorized" }

  const admin = createAdminSupabaseClient()
  const { error } = await admin.from("duas").delete().eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/admin")
  revalidateTag("duas-feed")
  revalidatePath("/")
  return { success: true }
}
