"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { isStripeMode, SITE_SETTING_KEYS, type StripeMode } from "@/lib/settings-keys"
import { getStripeSettingsForAdmin } from "@/lib/stripe-settings-server"

function canManageStripeSettings(ctx: NonNullable<Awaited<ReturnType<typeof getAdminContext>>>) {
  return ctx.isFoundingAdmin || hasPermission(ctx, "manage_settings")
}

export async function getStripeSettingsAdminView() {
  const ctx = await getAdminContext()
  if (!ctx || !canManageStripeSettings(ctx)) return null
  return getStripeSettingsForAdmin()
}

type StripeCredentialInput = {
  secretKey?: string
  publishableKey?: string
  webhookSecret?: string
  donationProductId?: string
  clearSecretKey?: boolean
  clearWebhookSecret?: boolean
}

type StripeSettingsInput = {
  mode?: StripeMode
  live?: StripeCredentialInput
  test?: StripeCredentialInput
}

function validateSecretKey(value: string, mode: StripeMode): string | null {
  const trimmed = value.trim()
  if (!trimmed) return "Secret key is required for donations."
  const livePattern = /^sk_live_|^rk_live_/
  const testPattern = /^sk_test_|^rk_test_/
  if (mode === "live" && !livePattern.test(trimmed)) {
    return "Live secret key should start with sk_live_ or rk_live_."
  }
  if (mode === "test" && !testPattern.test(trimmed)) {
    return "Test secret key should start with sk_test_ or rk_test_."
  }
  return null
}

function validatePublishableKey(value: string, mode: StripeMode): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (mode === "live" && !/^pk_live_/.test(trimmed)) {
    return "Live publishable key should start with pk_live_."
  }
  if (mode === "test" && !/^pk_test_/.test(trimmed)) {
    return "Test publishable key should start with pk_test_."
  }
  return null
}

function validateWebhookSecret(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (!/^whsec_/.test(trimmed)) {
    return "Webhook secret should start with whsec_."
  }
  return null
}

function validateProductId(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (!/^prod_/.test(trimmed)) {
    return "Product ID should start with prod_."
  }
  return null
}

async function upsertSetting(key: string, value: string) {
  const admin = createAdminSupabaseClient()
  return admin.from("site_settings").upsert(
    { key, value, updated_at: new Date().toISOString() },
    { onConflict: "key" },
  )
}

async function deleteSetting(key: string) {
  const admin = createAdminSupabaseClient()
  return admin.from("site_settings").delete().eq("key", key)
}

const LIVE_KEYS = {
  secretKey: SITE_SETTING_KEYS.stripeSecretKey,
  publishableKey: SITE_SETTING_KEYS.stripePublishableKey,
  webhookSecret: SITE_SETTING_KEYS.stripeWebhookSecret,
  donationProductId: SITE_SETTING_KEYS.stripeDonationProductId,
} as const

const TEST_KEYS = {
  secretKey: SITE_SETTING_KEYS.stripeTestSecretKey,
  publishableKey: SITE_SETTING_KEYS.stripeTestPublishableKey,
  webhookSecret: SITE_SETTING_KEYS.stripeTestWebhookSecret,
  donationProductId: SITE_SETTING_KEYS.stripeTestDonationProductId,
} as const

async function persistCredentialSet(
  mode: StripeMode,
  keys: typeof LIVE_KEYS,
  input: StripeCredentialInput | undefined,
  current: { hasSecretKey: boolean },
) {
  if (!input) return null

  const secretKeyInput = input.secretKey?.trim() ?? ""
  const publishableKeyInput = input.publishableKey?.trim() ?? ""
  const webhookSecretInput = input.webhookSecret?.trim() ?? ""
  const productIdInput = input.donationProductId?.trim() ?? ""

  if (input.clearSecretKey) {
    const { error } = await deleteSetting(keys.secretKey)
    if (error) return error.message
  } else if (secretKeyInput) {
    const secretError = validateSecretKey(secretKeyInput, mode)
    if (secretError) return secretError
    const { error } = await upsertSetting(keys.secretKey, secretKeyInput)
    if (error) return error.message
  }

  if (publishableKeyInput) {
    const publishableError = validatePublishableKey(publishableKeyInput, mode)
    if (publishableError) return publishableError
    const { error } = await upsertSetting(keys.publishableKey, publishableKeyInput)
    if (error) return error.message
  } else if (input.publishableKey !== undefined) {
    const { error } = await deleteSetting(keys.publishableKey)
    if (error) return error.message
  }

  if (input.clearWebhookSecret) {
    const { error } = await deleteSetting(keys.webhookSecret)
    if (error) return error.message
  } else if (webhookSecretInput) {
    const webhookError = validateWebhookSecret(webhookSecretInput)
    if (webhookError) return webhookError
    const { error } = await upsertSetting(keys.webhookSecret, webhookSecretInput)
    if (error) return error.message
  }

  if (productIdInput) {
    const productError = validateProductId(productIdInput)
    if (productError) return productError
    const { error } = await upsertSetting(keys.donationProductId, productIdInput)
    if (error) return error.message
  } else if (input.donationProductId !== undefined) {
    const { error } = await deleteSetting(keys.donationProductId)
    if (error) return error.message
  }

  if (
    !input.clearSecretKey &&
    !secretKeyInput &&
    !current.hasSecretKey &&
    (secretKeyInput || publishableKeyInput || webhookSecretInput || productIdInput || input.clearWebhookSecret)
  ) {
    // Allow partial updates when secret already exists elsewhere
  }

  return null
}

export async function updateStripeSettings(input: StripeSettingsInput) {
  const ctx = await getAdminContext()
  if (!ctx || !canManageStripeSettings(ctx)) return { error: "Unauthorized" as const }

  const current = await getStripeSettingsForAdmin()

  if (input.mode !== undefined) {
    if (!isStripeMode(input.mode)) {
      return { error: "Checkout mode must be test or live." }
    }
    const { error } = await upsertSetting(SITE_SETTING_KEYS.stripeMode, input.mode)
    if (error) return { error: error.message }
  }

  const liveError = await persistCredentialSet("live", LIVE_KEYS, input.live, current.live)
  if (liveError) return { error: liveError }

  const testError = await persistCredentialSet("test", TEST_KEYS, input.test, current.test)
  if (testError) return { error: testError }

  revalidateTag("stripe-settings")
  revalidatePath("/admin/integration")
  revalidatePath("/admin/settings/stripe")
  revalidatePath("/donate")

  return { success: true as const }
}

export async function updateStripeCheckoutMode(mode: StripeMode) {
  return updateStripeSettings({ mode })
}
