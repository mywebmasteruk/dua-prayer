"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { SITE_SETTING_KEYS } from "@/lib/settings-keys"
import { getStripeSettingsForAdmin } from "@/lib/stripe-settings-server"

function canManageStripeSettings(ctx: NonNullable<Awaited<ReturnType<typeof getAdminContext>>>) {
  return ctx.isFoundingAdmin || hasPermission(ctx, "manage_settings")
}

export async function getStripeSettingsAdminView() {
  const ctx = await getAdminContext()
  if (!ctx || !canManageStripeSettings(ctx)) return null
  return getStripeSettingsForAdmin()
}

type StripeSettingsInput = {
  secretKey?: string
  publishableKey?: string
  webhookSecret?: string
  donationProductId?: string
  clearSecretKey?: boolean
  clearWebhookSecret?: boolean
}

function validateSecretKey(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return "Secret key is required for donations."
  if (!/^sk_(live|test)_/.test(trimmed) && !/^rk_(live|test)_/.test(trimmed)) {
    return "Secret key should start with sk_live_, sk_test_, rk_live_, or rk_test_."
  }
  return null
}

function validatePublishableKey(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (!/^pk_(live|test)_/.test(trimmed)) {
    return "Publishable key should start with pk_live_ or pk_test_."
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

export async function updateStripeSettings(input: StripeSettingsInput) {
  const ctx = await getAdminContext()
  if (!ctx || !canManageStripeSettings(ctx)) return { error: "Unauthorized" as const }

  const current = await getStripeSettingsForAdmin()
  const secretKeyInput = input.secretKey?.trim() ?? ""
  const publishableKeyInput = input.publishableKey?.trim() ?? ""
  const webhookSecretInput = input.webhookSecret?.trim() ?? ""
  const productIdInput = input.donationProductId?.trim() ?? ""

  if (input.clearSecretKey) {
    const { error } = await deleteSetting(SITE_SETTING_KEYS.stripeSecretKey)
    if (error) return { error: error.message }
  } else if (secretKeyInput) {
    const secretError = validateSecretKey(secretKeyInput)
    if (secretError) return { error: secretError }
    const { error } = await upsertSetting(SITE_SETTING_KEYS.stripeSecretKey, secretKeyInput)
    if (error) return { error: error.message }
  } else if (!current.hasSecretKey) {
    return { error: "Paste your Stripe secret key to enable donations." }
  }

  if (publishableKeyInput) {
    const publishableError = validatePublishableKey(publishableKeyInput)
    if (publishableError) return { error: publishableError }
    const { error } = await upsertSetting(SITE_SETTING_KEYS.stripePublishableKey, publishableKeyInput)
    if (error) return { error: error.message }
  } else {
    const { error } = await deleteSetting(SITE_SETTING_KEYS.stripePublishableKey)
    if (error) return { error: error.message }
  }

  if (input.clearWebhookSecret) {
    const { error } = await deleteSetting(SITE_SETTING_KEYS.stripeWebhookSecret)
    if (error) return { error: error.message }
  } else if (webhookSecretInput) {
    const webhookError = validateWebhookSecret(webhookSecretInput)
    if (webhookError) return { error: webhookError }
    const { error } = await upsertSetting(SITE_SETTING_KEYS.stripeWebhookSecret, webhookSecretInput)
    if (error) return { error: error.message }
  }

  if (productIdInput) {
    const productError = validateProductId(productIdInput)
    if (productError) return { error: productError }
    const { error } = await upsertSetting(SITE_SETTING_KEYS.stripeDonationProductId, productIdInput)
    if (error) return { error: error.message }
  } else {
    const { error } = await deleteSetting(SITE_SETTING_KEYS.stripeDonationProductId)
    if (error) return { error: error.message }
  }

  revalidateTag("stripe-settings")
  revalidatePath("/admin/settings")
  revalidatePath("/admin/settings/stripe")
  revalidatePath("/donate")

  return { success: true as const }
}
