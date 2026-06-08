"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"

function compactNumber(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)
}

export async function getPlatformStats() {
  const supabase = await createServerSupabaseClient()

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
