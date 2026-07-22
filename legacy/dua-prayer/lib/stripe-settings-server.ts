import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { isMissingTableError } from "@/lib/db-errors"
import {
  isStripeMode,
  SITE_SETTING_KEYS,
  STRIPE_SITE_SETTING_KEYS,
  type StripeMode,
} from "@/lib/settings-keys"

export type StripeSettings = {
  secretKey: string | null
  publishableKey: string | null
  webhookSecret: string | null
  donationProductId: string | null
}

export type StripeCredentialAdminView = {
  hasSecretKey: boolean
  secretKeyLast4: string | null
  secretKeySource: "db" | "env" | null
  publishableKey: string
  publishableKeySource: "db" | "env" | null
  hasWebhookSecret: boolean
  webhookSecretLast4: string | null
  webhookSecretSource: "db" | "env" | null
  donationProductId: string
  donationProductIdSource: "db" | "env" | null
  ready: boolean
}

export type StripeSettingsAdminView = {
  mode: StripeMode
  live: StripeCredentialAdminView
  test: StripeCredentialAdminView
  donationsReady: boolean
  activeModeReady: boolean
}

type StripeKeySet = {
  secretKey: string
  publishableKey: string
  webhookSecret: string
  donationProductId: string
}

const LIVE_DB_KEYS: StripeKeySet = {
  secretKey: SITE_SETTING_KEYS.stripeSecretKey,
  publishableKey: SITE_SETTING_KEYS.stripePublishableKey,
  webhookSecret: SITE_SETTING_KEYS.stripeWebhookSecret,
  donationProductId: SITE_SETTING_KEYS.stripeDonationProductId,
}

const TEST_DB_KEYS: StripeKeySet = {
  secretKey: SITE_SETTING_KEYS.stripeTestSecretKey,
  publishableKey: SITE_SETTING_KEYS.stripeTestPublishableKey,
  webhookSecret: SITE_SETTING_KEYS.stripeTestWebhookSecret,
  donationProductId: SITE_SETTING_KEYS.stripeTestDonationProductId,
}

function trimOrNull(value: string | undefined | null): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function lastFour(value: string): string {
  return value.length <= 4 ? value : value.slice(-4)
}

function envLiveSettings(): StripeSettings {
  return {
    secretKey: trimOrNull(process.env.STRIPE_SECRET_KEY),
    publishableKey: trimOrNull(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    webhookSecret: trimOrNull(process.env.STRIPE_WEBHOOK_SECRET),
    donationProductId: trimOrNull(process.env.STRIPE_DONATION_PRODUCT_ID),
  }
}

function envTestSettings(): StripeSettings {
  return {
    secretKey: trimOrNull(process.env.STRIPE_TEST_SECRET_KEY),
    publishableKey: trimOrNull(process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY),
    webhookSecret: trimOrNull(process.env.STRIPE_TEST_WEBHOOK_SECRET),
    donationProductId: trimOrNull(process.env.STRIPE_TEST_DONATION_PRODUCT_ID),
  }
}

function readCredentialSet(
  byKey: Map<string, string>,
  dbKeys: StripeKeySet,
  envValues: StripeSettings,
): StripeSettings {
  return {
    secretKey: trimOrNull(byKey.get(dbKeys.secretKey)) ?? envValues.secretKey,
    publishableKey: trimOrNull(byKey.get(dbKeys.publishableKey)) ?? envValues.publishableKey,
    webhookSecret: trimOrNull(byKey.get(dbKeys.webhookSecret)) ?? envValues.webhookSecret,
    donationProductId:
      trimOrNull(byKey.get(dbKeys.donationProductId)) ?? envValues.donationProductId,
  }
}

function readDbCredentialSet(
  byKey: Map<string, string>,
  dbKeys: StripeKeySet,
): Partial<StripeSettings> {
  return {
    secretKey: trimOrNull(byKey.get(dbKeys.secretKey)),
    publishableKey: trimOrNull(byKey.get(dbKeys.publishableKey)),
    webhookSecret: trimOrNull(byKey.get(dbKeys.webhookSecret)),
    donationProductId: trimOrNull(byKey.get(dbKeys.donationProductId)),
  }
}

async function fetchStripeSettingsFromDb(): Promise<{
  mode: StripeMode
  live: StripeSettings
  test: StripeSettings
}> {
  let supabase
  try {
    supabase = createAdminSupabaseClient()
  } catch (error) {
    console.error("Stripe settings: Supabase admin client unavailable", error)
    return {
      mode: "live",
      live: envLiveSettings(),
      test: envTestSettings(),
    }
  }

  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", [...STRIPE_SITE_SETTING_KEYS])

  if (error) {
    if (!isMissingTableError(error)) {
      console.error("Error fetching Stripe settings:", error)
    }
    return {
      mode: "live",
      live: envLiveSettings(),
      test: envTestSettings(),
    }
  }

  const byKey = new Map((data ?? []).map((row) => [row.key, row.value]))
  const modeRaw = trimOrNull(byKey.get(SITE_SETTING_KEYS.stripeMode))
  const mode = isStripeMode(modeRaw) ? modeRaw : "live"

  return {
    mode,
    live: readCredentialSet(byKey, LIVE_DB_KEYS, envLiveSettings()),
    test: readCredentialSet(byKey, TEST_DB_KEYS, envTestSettings()),
  }
}

// SECURITY: do NOT use unstable_cache here — it serializes the cached value
// (including secretKey/webhookSecret) into the shared Next.js data cache,
// which on Vercel is remote storage. A module-level in-memory cache keeps
// secrets inside the running process only; the short TTL bounds staleness on
// other serverless instances the same way revalidate: 60 did.
const STRIPE_SETTINGS_TTL_MS = 60_000

type CachedStripeSettings = Awaited<ReturnType<typeof fetchStripeSettingsFromDb>>

let stripeSettingsCache: { value: CachedStripeSettings; expiresAt: number } | null = null

async function getStripeSettingsFromDbCached(): Promise<CachedStripeSettings> {
  const now = Date.now()
  if (stripeSettingsCache && now < stripeSettingsCache.expiresAt) {
    return stripeSettingsCache.value
  }
  const value = await fetchStripeSettingsFromDb()
  stripeSettingsCache = { value, expiresAt: now + STRIPE_SETTINGS_TTL_MS }
  return value
}

/** Call after admin updates Stripe settings so this instance re-reads immediately. */
export function invalidateStripeSettingsCache(): void {
  stripeSettingsCache = null
}

function pickSource(dbValue: string | null | undefined, envValue: string | null): "db" | "env" | null {
  if (dbValue) return "db"
  if (envValue) return "env"
  return null
}

function buildCredentialAdminView(
  merged: StripeSettings,
  fromDb: Partial<StripeSettings>,
  fromEnv: StripeSettings,
): StripeCredentialAdminView {
  return {
    hasSecretKey: Boolean(merged.secretKey),
    secretKeyLast4: merged.secretKey ? lastFour(merged.secretKey) : null,
    secretKeySource: pickSource(fromDb.secretKey, fromEnv.secretKey),
    publishableKey: fromDb.publishableKey ?? fromEnv.publishableKey ?? "",
    publishableKeySource: pickSource(fromDb.publishableKey, fromEnv.publishableKey),
    hasWebhookSecret: Boolean(merged.webhookSecret),
    webhookSecretLast4: merged.webhookSecret ? lastFour(merged.webhookSecret) : null,
    webhookSecretSource: pickSource(fromDb.webhookSecret, fromEnv.webhookSecret),
    donationProductId: fromDb.donationProductId ?? fromEnv.donationProductId ?? "",
    donationProductIdSource: pickSource(fromDb.donationProductId, fromEnv.donationProductId),
    ready: Boolean(merged.secretKey),
  }
}

export async function getStripeMode(): Promise<StripeMode> {
  const settings = await getStripeSettingsFromDbCached()
  return settings.mode
}

export async function getStripeSettings(): Promise<StripeSettings & { mode: StripeMode }> {
  const { mode, live, test } = await getStripeSettingsFromDbCached()
  const active = mode === "test" ? test : live
  return { ...active, mode }
}

const EMPTY_CREDENTIAL_VIEW: StripeCredentialAdminView = {
  hasSecretKey: false,
  secretKeyLast4: null,
  secretKeySource: null,
  publishableKey: "",
  publishableKeySource: null,
  hasWebhookSecret: false,
  webhookSecretLast4: null,
  webhookSecretSource: null,
  donationProductId: "",
  donationProductIdSource: null,
  ready: false,
}

export function emptyStripeSettingsAdminView(): StripeSettingsAdminView {
  return {
    mode: "live",
    live: { ...EMPTY_CREDENTIAL_VIEW },
    test: { ...EMPTY_CREDENTIAL_VIEW },
    donationsReady: false,
    activeModeReady: false,
  }
}

export async function getStripeSettingsForAdmin(): Promise<StripeSettingsAdminView> {
  let supabase
  try {
    supabase = createAdminSupabaseClient()
  } catch (error) {
    console.error("Stripe settings admin: missing Supabase credentials", error)
    return emptyStripeSettingsAdminView()
  }
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", [...STRIPE_SITE_SETTING_KEYS])

  const byKey = new Map<string, string>()
  if (!error) {
    for (const row of data ?? []) {
      byKey.set(row.key, row.value)
    }
  } else if (!isMissingTableError(error)) {
    console.error("Error fetching Stripe settings for admin:", error)
  }

  const modeRaw = trimOrNull(byKey.get(SITE_SETTING_KEYS.stripeMode))
  const mode = isStripeMode(modeRaw) ? modeRaw : "live"

  const liveEnv = envLiveSettings()
  const testEnv = envTestSettings()
  const liveDb = readDbCredentialSet(byKey, LIVE_DB_KEYS)
  const testDb = readDbCredentialSet(byKey, TEST_DB_KEYS)
  const liveMerged = readCredentialSet(byKey, LIVE_DB_KEYS, liveEnv)
  const testMerged = readCredentialSet(byKey, TEST_DB_KEYS, testEnv)

  const live = buildCredentialAdminView(liveMerged, liveDb, liveEnv)
  const test = buildCredentialAdminView(testMerged, testDb, testEnv)
  const activeModeReady = mode === "test" ? test.ready : live.ready

  return {
    mode,
    live,
    test,
    donationsReady: activeModeReady,
    activeModeReady,
  }
}

export async function getStripeWebhookSecret(): Promise<string | null> {
  const settings = await getStripeSettings()
  return settings.webhookSecret
}
