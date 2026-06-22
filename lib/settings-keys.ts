export const SITE_SETTING_KEYS = {
  channelFormFields: "channel_form.fields",
  volunteerFormFields: "volunteer_form.fields",
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
  aiProviderEnabled: "ai_moderation.enabled",
  aiProviderProvider: "ai_moderation.provider",
  aiProviderApiKey: "ai_moderation.api_key",
  aiProviderModel: "ai_moderation.model",
  // "auto" = resolve the latest capable free model automatically (OpenRouter);
  // "manual" = use aiProviderModel as entered.
  aiProviderModelMode: "ai_moderation.model_mode",
  // Max ms to wait for a moderation verdict before failing open (publishing).
  aiModerationTimeoutMs: "ai_moderation.timeout_ms",
  // Reasoning effort for hybrid models: "none" | "low" | "medium" | "high".
  aiReasoningEffort: "ai_moderation.reasoning_effort",
  // Max output tokens per AI call.
  aiMaxTokens: "ai_moderation.max_tokens",
  // Sampling temperature for AI calls (0-2).
  aiTemperature: "ai_moderation.temperature",
  // Max ms to wait for a generation AI call before aborting.
  aiRequestTimeoutMs: "ai_moderation.request_timeout_ms",
  postingMode: "posting.mode",
  // Editable role → permission presets (JSON). Overrides the hardcoded defaults.
  adminRolePermissions: "admin.role_permissions",
  customCodeHeader: "custom_code.header",
  customCodeFooter: "custom_code.footer",
  // SEO & social share (Open Graph / Twitter cards) + favicon.
  seoSiteName: "seo.site_name",
  seoTitle: "seo.title",
  seoDescription: "seo.description",
  seoImage: "seo.image",
  seoFavicon: "seo.favicon",
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

export const AI_PROVIDER_SITE_SETTING_KEYS = [
  SITE_SETTING_KEYS.aiProviderEnabled,
  SITE_SETTING_KEYS.aiProviderProvider,
  SITE_SETTING_KEYS.aiProviderApiKey,
  SITE_SETTING_KEYS.aiProviderModel,
] as const

export const AI_MODERATION_SITE_SETTING_KEYS = AI_PROVIDER_SITE_SETTING_KEYS

export type SiteSettingKey = (typeof SITE_SETTING_KEYS)[keyof typeof SITE_SETTING_KEYS]

export type StripeMode = "test" | "live"

export function isStripeMode(value: string | null | undefined): value is StripeMode {
  return value === "test" || value === "live"
}
