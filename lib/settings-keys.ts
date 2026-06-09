export const SITE_SETTING_KEYS = {
  volunteerFilloutEmbed: "volunteer_fillout_embed",
  copySidebarTagline: "copy.sidebar_tagline",
  copyFooterTagline: "copy.footer_tagline",
  copyAboutMission: "copy.about_mission",
  stripeMode: "stripe.mode",
  stripeSecretKey: "stripe.secret_key",
  stripePublishableKey: "stripe.publishable_key",
  stripeWebhookSecret: "stripe.webhook_secret",
  stripeDonationProductId: "stripe.donation_product_id",
  stripeTestSecretKey: "stripe.test.secret_key",
  stripeTestPublishableKey: "stripe.test.publishable_key",
  stripeTestWebhookSecret: "stripe.test.webhook_secret",
  stripeTestDonationProductId: "stripe.test.donation_product_id",
} as const

/** Keys stored in site_settings — never exposed via public RLS policy */
export const STRIPE_SITE_SETTING_KEYS = [
  SITE_SETTING_KEYS.stripeMode,
  SITE_SETTING_KEYS.stripeSecretKey,
  SITE_SETTING_KEYS.stripePublishableKey,
  SITE_SETTING_KEYS.stripeWebhookSecret,
  SITE_SETTING_KEYS.stripeDonationProductId,
  SITE_SETTING_KEYS.stripeTestSecretKey,
  SITE_SETTING_KEYS.stripeTestPublishableKey,
  SITE_SETTING_KEYS.stripeTestWebhookSecret,
  SITE_SETTING_KEYS.stripeTestDonationProductId,
] as const

export type SiteSettingKey = (typeof SITE_SETTING_KEYS)[keyof typeof SITE_SETTING_KEYS]

export type StripeMode = "test" | "live"

export function isStripeMode(value: string | null | undefined): value is StripeMode {
  return value === "test" || value === "live"
}
