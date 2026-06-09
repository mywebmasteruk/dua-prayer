export const SITE_SETTING_KEYS = {
  volunteerFilloutEmbed: "volunteer_fillout_embed",
  copySidebarTagline: "copy.sidebar_tagline",
  copyFooterTagline: "copy.footer_tagline",
  copyAboutMission: "copy.about_mission",
  stripeSecretKey: "stripe.secret_key",
  stripePublishableKey: "stripe.publishable_key",
  stripeWebhookSecret: "stripe.webhook_secret",
  stripeDonationProductId: "stripe.donation_product_id",
} as const

/** Keys stored in site_settings — never exposed via public RLS policy */
export const STRIPE_SITE_SETTING_KEYS = [
  SITE_SETTING_KEYS.stripeSecretKey,
  SITE_SETTING_KEYS.stripePublishableKey,
  SITE_SETTING_KEYS.stripeWebhookSecret,
  SITE_SETTING_KEYS.stripeDonationProductId,
] as const

export type SiteSettingKey = (typeof SITE_SETTING_KEYS)[keyof typeof SITE_SETTING_KEYS]
