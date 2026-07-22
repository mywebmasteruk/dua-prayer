import { unstable_cache } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

function compactNumber(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)
}

async function fetchPlatformStats() {
  const supabase = createAdminSupabaseClient()

  const [{ data: totals, error: totalsError }, { count: totalCategories }] = await Promise.all([
    supabase.rpc("platform_dua_totals"),
    supabase.from("categories").select("*", { count: "exact", head: true }),
  ])

  if (totalsError) console.error("Error fetching platform dua totals:", totalsError)
  const row = (totals as Array<{ total_duas: number; total_ameens: number }> | null)?.[0]
  const totalDuas = Number(row?.total_duas ?? 0)
  const totalAmeens = Number(row?.total_ameens ?? 0)

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
