import { unstable_cache } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { isMissingTableError } from "@/lib/db-errors"
import { parseFilloutEmbed } from "@/lib/fillout"
import { sanitizeBannerColor } from "@/lib/banner-rich-text"
import { SITE_SETTING_KEYS } from "@/lib/settings-keys"
import {
  DEFAULT_CHANNEL_REGISTRY,
  DEFAULT_VOLUNTEER_REGISTRY,
  parseFormRegistry,
  type FormRegistry,
} from "@/lib/form-fields"

async function fetchSiteSettingValue(key: string): Promise<string | null> {
  let supabase
  try {
    supabase = createAdminSupabaseClient()
  } catch (error) {
    console.error(`Site setting ${key}: missing Supabase credentials`, error)
    return null
  }

  const { data, error } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle()

  if (error) {
    if (!isMissingTableError(error)) {
      console.error(`Error fetching site setting ${key}:`, error)
    }
    return null
  }

  return data?.value ?? null
}

const getVolunteerFilloutSettingCached = unstable_cache(
  () => fetchSiteSettingValue(SITE_SETTING_KEYS.volunteerFilloutEmbed),
  ["site-setting-volunteer-fillout"],
  { revalidate: 300, tags: ["site-setting-volunteer-fillout"] },
)

const getChannelFilloutSettingCached = unstable_cache(
  () => fetchSiteSettingValue(SITE_SETTING_KEYS.channelFilloutEmbed),
  ["site-setting-channel-fillout"],
  { revalidate: 300, tags: ["site-setting-channel-fillout"] },
)

export const BETA_BANNER_DEFAULTS = {
  enabled: true,
  message: "DuaPrayer is currently in beta. Features and content may change as we improve the experience.",
  bgColor: "#fef3c7",
} as const

export type BetaBannerSettings = {
  enabled: boolean
  message: string
  bgColor: string
}

async function fetchBetaBannerSettings(): Promise<BetaBannerSettings> {
  let supabase
  try {
    supabase = createAdminSupabaseClient()
  } catch (error) {
    console.error("Beta banner settings: missing Supabase credentials", error)
    return { ...BETA_BANNER_DEFAULTS }
  }

  const keys = [SITE_SETTING_KEYS.betaBannerEnabled, SITE_SETTING_KEYS.betaBannerMessage, SITE_SETTING_KEYS.betaBannerBgColor]
  const { data, error } = await supabase.from("site_settings").select("key, value").in("key", keys)

  if (error) {
    if (!isMissingTableError(error)) {
      console.error("Error fetching beta banner settings:", error)
    }
    return { ...BETA_BANNER_DEFAULTS }
  }

  const byKey = new Map((data ?? []).map((row) => [row.key, row.value]))
  return {
    enabled: (byKey.get(SITE_SETTING_KEYS.betaBannerEnabled) ?? "true") !== "false",
    message: byKey.get(SITE_SETTING_KEYS.betaBannerMessage)?.trim() || BETA_BANNER_DEFAULTS.message,
    bgColor: sanitizeBannerColor(byKey.get(SITE_SETTING_KEYS.betaBannerBgColor), BETA_BANNER_DEFAULTS.bgColor),
  }
}

const getBetaBannerSettingsCached = unstable_cache(fetchBetaBannerSettings, ["site-setting-beta-banner"], {
  revalidate: 300,
  tags: ["site-setting-beta-banner"],
})

export async function getBetaBannerSettings(): Promise<BetaBannerSettings> {
  return getBetaBannerSettingsCached()
}

export async function getBetaBannerSettingsForAdmin(): Promise<BetaBannerSettings> {
  return fetchBetaBannerSettings()
}

export async function getVolunteerFilloutEmbedSrc(): Promise<string | null> {
  const raw = await getVolunteerFilloutSettingCached()
  if (!raw) return null

  const parsed = parseFilloutEmbed(raw)
  return parsed?.src ?? null
}

/** Uncached read for admin integration UI — caller must enforce RBAC. */
export async function getVolunteerFilloutSettingValue(): Promise<string> {
  const value = await fetchSiteSettingValue(SITE_SETTING_KEYS.volunteerFilloutEmbed)
  return value ?? ""
}

export async function getChannelFilloutEmbedSrc(): Promise<string | null> {
  const raw = await getChannelFilloutSettingCached()
  if (!raw) return null

  const parsed = parseFilloutEmbed(raw)
  return parsed?.src ?? null
}

/** Uncached read for admin channels UI — caller must enforce RBAC. */
export async function getChannelFilloutSettingValue(): Promise<string> {
  const value = await fetchSiteSettingValue(SITE_SETTING_KEYS.channelFilloutEmbed)
  return value ?? ""
}

const getChannelFormRegistryCached = unstable_cache(
  () => fetchSiteSettingValue(SITE_SETTING_KEYS.channelFormFields),
  ["site-setting-channel-form"],
  { revalidate: 300, tags: ["site-setting-channel-form"] },
)

const getVolunteerFormRegistryCached = unstable_cache(
  () => fetchSiteSettingValue(SITE_SETTING_KEYS.volunteerFormFields),
  ["site-setting-volunteer-form"],
  { revalidate: 300, tags: ["site-setting-volunteer-form"] },
)

export async function getChannelFormRegistry(): Promise<FormRegistry> {
  return parseFormRegistry(await getChannelFormRegistryCached(), DEFAULT_CHANNEL_REGISTRY)
}

export async function getVolunteerFormRegistry(): Promise<FormRegistry> {
  return parseFormRegistry(await getVolunteerFormRegistryCached(), DEFAULT_VOLUNTEER_REGISTRY)
}

/** Uncached reads for the admin form builder — caller must enforce RBAC. */
export async function getChannelFormRegistryForAdmin(): Promise<FormRegistry> {
  return parseFormRegistry(await fetchSiteSettingValue(SITE_SETTING_KEYS.channelFormFields), DEFAULT_CHANNEL_REGISTRY)
}

export async function getVolunteerFormRegistryForAdmin(): Promise<FormRegistry> {
  return parseFormRegistry(await fetchSiteSettingValue(SITE_SETTING_KEYS.volunteerFormFields), DEFAULT_VOLUNTEER_REGISTRY)
}
