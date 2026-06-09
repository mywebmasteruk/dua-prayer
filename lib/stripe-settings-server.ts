import { unstable_cache } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { isMissingTableError } from "@/lib/db-errors"
import { SITE_SETTING_KEYS, STRIPE_SITE_SETTING_KEYS } from "@/lib/settings-keys"

export type StripeSettings = {
  secretKey: string | null
  publishableKey: string | null
  webhookSecret: string | null
  donationProductId: string | null
}

export type StripeSettingsAdminView = {
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
  donationsReady: boolean
}

function trimOrNull(value: string | undefined | null): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function lastFour(value: string): string {
  return value.length <= 4 ? value : value.slice(-4)
}

function envStripeSettings(): StripeSettings {
  return {
    secretKey: trimOrNull(process.env.STRIPE_SECRET_KEY),
    publishableKey: trimOrNull(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    webhookSecret: trimOrNull(process.env.STRIPE_WEBHOOK_SECRET),
    donationProductId: trimOrNull(process.env.STRIPE_DONATION_PRODUCT_ID),
  }
}

async function fetchStripeSettingsFromDb(): Promise<Partial<StripeSettings>> {
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", [...STRIPE_SITE_SETTING_KEYS])

  if (error) {
    if (!isMissingTableError(error)) {
      console.error("Error fetching Stripe settings:", error)
    }
    return {}
  }

  const byKey = new Map((data ?? []).map((row) => [row.key, row.value]))

  return {
    secretKey: trimOrNull(byKey.get(SITE_SETTING_KEYS.stripeSecretKey)),
    publishableKey: trimOrNull(byKey.get(SITE_SETTING_KEYS.stripePublishableKey)),
    webhookSecret: trimOrNull(byKey.get(SITE_SETTING_KEYS.stripeWebhookSecret)),
    donationProductId: trimOrNull(byKey.get(SITE_SETTING_KEYS.stripeDonationProductId)),
  }
}

const getStripeSettingsFromDbCached = unstable_cache(
  fetchStripeSettingsFromDb,
  ["stripe-settings"],
  { revalidate: 60, tags: ["stripe-settings"] },
)

function pickSource(dbValue: string | null | undefined, envValue: string | null): "db" | "env" | null {
  if (dbValue) return "db"
  if (envValue) return "env"
  return null
}

export async function getStripeSettings(): Promise<StripeSettings> {
  const fromDb = await getStripeSettingsFromDbCached()
  const fromEnv = envStripeSettings()

  return {
    secretKey: fromDb.secretKey ?? fromEnv.secretKey,
    publishableKey: fromDb.publishableKey ?? fromEnv.publishableKey,
    webhookSecret: fromDb.webhookSecret ?? fromEnv.webhookSecret,
    donationProductId: fromDb.donationProductId ?? fromEnv.donationProductId,
  }
}

export async function getStripeSettingsForAdmin(): Promise<StripeSettingsAdminView> {
  const fromDb = await fetchStripeSettingsFromDb()
  const fromEnv = envStripeSettings()
  const merged = await getStripeSettings()

  const secretKeySource = pickSource(fromDb.secretKey, fromEnv.secretKey)
  const publishableKeySource = pickSource(fromDb.publishableKey, fromEnv.publishableKey)
  const webhookSecretSource = pickSource(fromDb.webhookSecret, fromEnv.webhookSecret)
  const donationProductIdSource = pickSource(fromDb.donationProductId, fromEnv.donationProductId)

  return {
    hasSecretKey: Boolean(merged.secretKey),
    secretKeyLast4: merged.secretKey ? lastFour(merged.secretKey) : null,
    secretKeySource,
    publishableKey: fromDb.publishableKey ?? fromEnv.publishableKey ?? "",
    publishableKeySource,
    hasWebhookSecret: Boolean(merged.webhookSecret),
    webhookSecretLast4: merged.webhookSecret ? lastFour(merged.webhookSecret) : null,
    webhookSecretSource,
    donationProductId: fromDb.donationProductId ?? fromEnv.donationProductId ?? "",
    donationProductIdSource,
    donationsReady: Boolean(merged.secretKey),
  }
}

export async function getStripeWebhookSecret(): Promise<string | null> {
  const settings = await getStripeSettings()
  return settings.webhookSecret
}
