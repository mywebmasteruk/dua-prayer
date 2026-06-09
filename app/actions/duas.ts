"use server"

import { headers, cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { requirePermission } from "@/lib/auth"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { verifyTurnstile } from "@/lib/turnstile"
import { randomBytes } from "crypto"
import { isMissingColumnError } from "@/lib/db-errors"
import type { Category } from "@/lib/types/dua"

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
    .select("id, text, user_id, category_id, likes, created_at, published, flagged", { count: "exact" })
    .eq("published", true)
    .order("created_at", { ascending: false })
    .range(from, to)

  if (options.category && options.category !== "all") {
    query = query.eq("category_id", Number.parseInt(options.category))
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

export async function getAdminDuas(filters: { search?: string; status?: string; category?: string }) {
  const gate = await requirePermission("manage_duas")
  if (!gate.ok) return []

  const admin = createAdminSupabaseClient()
  let query = admin
    .from("duas")
    .select("id, text, user_id, category_id, likes, created_at, published, flagged")
    .order("created_at", { ascending: false })

  if (filters.search) query = query.ilike("text", `%${filters.search}%`)
  if (filters.status === "published") query = query.eq("published", true)
  else if (filters.status === "unpublished") query = query.eq("published", false)
  else if (filters.status === "flagged") query = query.eq("flagged", true)
  if (filters.category && filters.category !== "all") {
    query = query.eq("category_id", Number.parseInt(filters.category))
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
  created_at?: string
  updated_at?: string
}): Category {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    is_active: row.is_active ?? true,
    sort_order: row.sort_order ?? 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

async function fetchCategoriesFromDb(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  options: { includeInactive?: boolean } = {},
): Promise<Category[]> {
  let query = supabase
    .from("categories")
    .select("id, name, description, is_active, sort_order, created_at, updated_at")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })

  if (!options.includeInactive) {
    query = query.eq("is_active", true)
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
    .select("id, name, created_at")
    .order("name", { ascending: true })

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
  }>,
) {
  const supabase = await createServerSupabaseClient()
  const { data: categories } = await supabase.from("categories").select("id, name")
  const categoryMap = new Map(categories?.map((c) => [c.id, c.name]) ?? [])

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let prayedIds = new Set<number>()
  if (user) {
    const { data: prayers } = await supabase.from("dua_prayers").select("dua_id").eq("user_id", user.id)
    prayedIds = new Set(prayers?.map((p) => p.dua_id) ?? [])
  } else {
    const voterHash = (await cookies()).get("dua_voter")?.value
    if (voterHash) {
      const admin = createAdminSupabaseClient()
      const { data: prayers } = await admin.from("dua_prayers").select("dua_id").eq("voter_hash", voterHash)
      prayedIds = new Set(prayers?.map((p) => p.dua_id) ?? [])
    }
  }

  return duas.map((dua) => ({
    ...dua,
    category_name: dua.category_id ? categoryMap.get(dua.category_id) : undefined,
    user_has_prayed: prayedIds.has(dua.id),
  }))
}

export async function countNewDuasSince(sinceId: number) {
  if (!Number.isFinite(sinceId) || sinceId < 0) return 0

  const supabase = await createServerSupabaseClient()
  const { count, error } = await supabase
    .from("duas")
    .select("id", { count: "exact", head: true })
    .eq("published", true)
    .gt("id", sinceId)

  if (error) {
    console.error("Error counting new duas:", error)
    return 0
  }

  return count ?? 0
}

export async function getFeedDuas() {
  const supabase = await createServerSupabaseClient()

  const { data: duas, error, count } = await supabase
    .from("duas")
    .select("id, text, user_id, category_id, likes, created_at, published, flagged", { count: "exact" })
    .eq("published", true)
    .order("created_at", { ascending: false })
    .range(0, FEED_BATCH_SIZE - 1)

  if (error) {
    console.error("Error fetching feed duas:", error)
    return { duas: [], total: 0, pageSize: PAGE_SIZE }
  }

  return {
    duas: await enrichDuas(duas ?? []),
    total: count ?? 0,
    pageSize: PAGE_SIZE,
  }
}

export async function getTopCategories(limit = 3) {
  const supabase = await createServerSupabaseClient()
  const [{ data: duas, error: duasError }, categories] = await Promise.all([
    supabase.from("duas").select("category_id").eq("published", true).not("category_id", "is", null),
    fetchCategoriesFromDb(supabase),
  ])

  if (duasError) console.error("Error fetching category usage:", duasError)

  const counts = new Map<number, number>()
  for (const dua of duas ?? []) {
    if (!dua.category_id) continue
    counts.set(dua.category_id, (counts.get(dua.category_id) ?? 0) + 1)
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
  if (text.length > 280) return { error: "Dua must be 280 characters or less" }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminSupabaseClient()

  const { error } = await admin.from("duas").insert({
    text,
    category_id: categoryId ? Number.parseInt(categoryId) : null,
    published: true,
    flagged: false,
    user_id: user?.id ?? null,
  })

  if (error) {
    console.error("Error creating dua:", error)
    return { error: error.message }
  }

  revalidatePath("/")
  return { success: true }
}

export async function prayForDua(duaId: number) {
  const headersList = await headers()
  const ip = getClientIp(headersList)
  const rate = checkRateLimit(`pray:${ip}`, 30)
  if (!rate.allowed) return { error: "Too many requests. Please slow down." }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
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

  revalidatePath("/")
  return { success: true, counted: result.counted, likes: result.likes }
}

export async function flagDua(duaId: number) {
  const headersList = await headers()
  const ip = getClientIp(headersList)
  const rate = checkRateLimit(`flag:${ip}`, 10)
  if (!rate.allowed) return { error: "Too many flags. Please wait." }

  const admin = createAdminSupabaseClient()
  const { error } = await admin.from("duas").update({ flagged: true }).eq("id", duaId)

  if (error) {
    console.error("Error flagging:", error)
    return { error: "Could not flag this dua" }
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
  revalidatePath("/")
  return { success: true }
}

export async function unflagDua(id: number) {
  const gate = await requirePermission("manage_duas")
  if (!gate.ok) return { error: "Unauthorized" }

  const admin = createAdminSupabaseClient()
  const { error } = await admin.from("duas").update({ flagged: false }).eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/admin")
  return { success: true }
}

export async function updateDua(id: number, text: string, categoryId: number | null) {
  const gate = await requirePermission("manage_duas")
  if (!gate.ok) return { error: "Unauthorized" }

  const admin = createAdminSupabaseClient()
  const { error } = await admin.from("duas").update({ text, category_id: categoryId }).eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/admin")
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
  revalidatePath("/")
  return { success: true }
}
