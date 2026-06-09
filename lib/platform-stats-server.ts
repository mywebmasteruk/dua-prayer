import { unstable_cache } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

function compactNumber(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)
}

async function fetchPlatformStats() {
  const supabase = createAdminSupabaseClient()

  const [{ count: totalDuas }, { count: totalCategories }, { data: likesRows }] = await Promise.all([
    supabase.from("duas").select("*", { count: "exact", head: true }).eq("published", true),
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase.from("duas").select("likes").eq("published", true),
  ])

  const totalAmeens = (likesRows ?? []).reduce((sum, row) => sum + (row.likes ?? 0), 0)

  return {
    totalDuas: totalDuas ?? 0,
    totalCategories: totalCategories ?? 0,
    totalAmeens,
    totalDuasLabel: compactNumber(totalDuas ?? 0),
    totalAmeensLabel: compactNumber(totalAmeens),
    totalCategoriesLabel: String(totalCategories ?? 0),
  }
}

/** Public aggregate stats — cached to keep donate page off the hot DB path. */
export const getPlatformStats = unstable_cache(fetchPlatformStats, ["platform-stats"], {
  revalidate: 60,
  tags: ["platform-stats"],
})
