import { unstable_cache } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { isMissingTableError } from "@/lib/db-errors"
import { SITE_SETTING_KEYS } from "@/lib/settings-keys"
import { normalizePostingMode, type PostingMode } from "@/lib/posting-settings-shared"

export {
  getPostingModeOption,
  isPostingMode,
  POSTING_MODE_OPTIONS,
  POSTING_MODES,
  shouldAllowPublicDuaSubmission,
  type PostingMode,
  type PostingModeOption,
  type PublicDuaSubmissionAccess,
} from "@/lib/posting-settings-shared"

async function fetchPostingMode(): Promise<PostingMode> {
  let supabase
  try {
    supabase = createAdminSupabaseClient()
  } catch (error) {
    console.error("Posting settings: missing Supabase credentials", error)
    return "public"
  }

  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", SITE_SETTING_KEYS.postingMode)
    .maybeSingle()

  if (error) {
    if (!isMissingTableError(error)) {
      console.error("Error fetching posting mode:", error)
    }
    return "public"
  }

  return normalizePostingMode(data?.value)
}

const getPostingModeCached = unstable_cache(fetchPostingMode, ["site-setting-posting-mode"], {
  revalidate: 300,
  tags: ["site-setting-posting-mode"],
})

export async function getPostingMode(): Promise<PostingMode> {
  return getPostingModeCached()
}

export async function getPostingModeForAdmin(): Promise<PostingMode> {
  return fetchPostingMode()
}
