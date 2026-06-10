export const SITE_SETTING_KEYS = {
  volunteerFilloutEmbed: "volunteer_fillout_embed",
  channelFilloutEmbed: "channel_fillout_embed",
  betaBannerEnabled: "beta_banner.enabled",
  betaBannerMessage: "beta_banner.message",
  betaBannerBgColor: "beta_banner.bg_color",
  copySidebarTagline: "copy.sidebar_tagline",
  copyFooterTagline: "copy.footer_tagline",
  copyAboutMission: "copy.about_mission",
  copyAuthTagline: "copy.auth_tagline",
  copyHomeFollowingEmptyTitle: "copy.home_following_empty_title",
  copyHomeFollowingEmptyDescription: "copy.home_following_empty_description",
  copyHomeFollowingEmptyCta: "copy.home_following_empty_cta",
  copyHomeFeedEmptyTitle: "copy.home_feed_empty_title",
  copyHomeFeedEmptyDescription: "copy.home_feed_empty_description",
  copyChannelsPageSubtitle: "copy.channels_page_subtitle",
  copyDonatePageTitle: "copy.donate_page_title",
  copyDonatePageIntro: "copy.donate_page_intro",
  copyComposerTitleEn: "copy.composer.title.en",
  copyComposerDescriptionEn: "copy.composer.description.en",
  copyComposerPlaceholderEn: "copy.composer.placeholder.en",
  copyComposerCategoryPlaceholderEn: "copy.composer.category_placeholder.en",
  copyComposerSubmitEn: "copy.composer.submit.en",
  copyComposerSubmitAriaEn: "copy.composer.submit_aria.en",
  copyComposerSubmittingEn: "copy.composer.submitting.en",
  copyComposerTitleAr: "copy.composer.title.ar",
  copyComposerDescriptionAr: "copy.composer.description.ar",
  copyComposerPlaceholderAr: "copy.composer.placeholder.ar",
  copyComposerCategoryPlaceholderAr: "copy.composer.category_placeholder.ar",
  copyComposerSubmitAr: "copy.composer.submit.ar",
  copyComposerSubmitAriaAr: "copy.composer.submit_aria.ar",
  copyComposerSubmittingAr: "copy.composer.submitting.ar",
  copyComposerCategoryFamilyAr: "copy.composer.category.family.ar",
  copyComposerCategoryForgivenessAr: "copy.composer.category.forgiveness.ar",
  copyComposerCategoryGeneralAr: "copy.composer.category.general.ar",
  copyComposerCategoryHealthAr: "copy.composer.category.health.ar",
  copyComposerCategoryCommunityAr: "copy.composer.category.community.ar",
  copyComposerCategoryGuidanceAr: "copy.composer.category.guidance.ar",
  copyComposerCategoryGratitudeAr: "copy.composer.category.gratitude.ar",
  copyComposerCategoryProtectionAr: "copy.composer.category.protection.ar",
  stripeMode: "stripe.mode",
  stripeSecretKey: "stripe.secret_key",
  stripePublishableKey: "stripe.publishable_key",
  stripeWebhookSecret: "stripe.webhook_secret",
  stripeDonationProductId: "stripe.donation_product_id",
  stripeTestSecretKey: "stripe.test.secret_key",
  stripeTestPublishableKey: "stripe.test.publishable_key",
  stripeTestWebhookSecret: "stripe.test.webhook_secret",
  stripeTestDonationProductId: "stripe.test.donation_product_id",
  aiModerationEnabled: "ai_moderation.enabled",
  aiModerationProvider: "ai_moderation.provider",
  aiModerationApiKey: "ai_moderation.api_key",
  aiModerationModel: "ai_moderation.model",
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

export const AI_MODERATION_SITE_SETTING_KEYS = [
  SITE_SETTING_KEYS.aiModerationEnabled,
  SITE_SETTING_KEYS.aiModerationProvider,
  SITE_SETTING_KEYS.aiModerationApiKey,
  SITE_SETTING_KEYS.aiModerationModel,
] as const

export type SiteSettingKey = (typeof SITE_SETTING_KEYS)[keyof typeof SITE_SETTING_KEYS]

export type StripeMode = "test" | "live"

export function isStripeMode(value: string | null | undefined): value is StripeMode {
  return value === "test" || value === "live"
}
