import { unstable_cache } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { isMissingTableError } from "@/lib/db-errors"
import { SITE_SETTING_KEYS } from "@/lib/settings-keys"

type CustomCode = { header: string; footer: string }

async function fetchCustomCode(): Promise<CustomCode> {
  let supabase
  try {
    supabase = createAdminSupabaseClient()
  } catch {
    return { header: "", footer: "" }
  }

  const keys = [SITE_SETTING_KEYS.customCodeHeader, SITE_SETTING_KEYS.customCodeFooter]
  const { data, error } = await supabase.from("site_settings").select("key, value").in("key", keys)

  if (error) {
    if (!isMissingTableError(error)) {
      console.error("Error fetching custom code settings:", error)
    }
    return { header: "", footer: "" }
  }

  const byKey = new Map((data ?? []).map((row) => [row.key, row.value as string]))
  return {
    header: byKey.get(SITE_SETTING_KEYS.customCodeHeader) ?? "",
    footer: byKey.get(SITE_SETTING_KEYS.customCodeFooter) ?? "",
  }
}

export const getCustomCode = unstable_cache(fetchCustomCode, ["custom-code"], {
  revalidate: 300,
  tags: ["custom-code"],
})
