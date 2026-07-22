export const SITE_COPY_DEFAULTS = {
  footerTagline:
    'A community platform for sharing duas and responding with ameen.',
  authTagline: 'Share duas, support one another, and browse community activity.',
  aboutMission:
    'DuaPrayer is a community platform where people share prayer requests and respond with ameen. We build simple, welcoming technology so collective duas can travel further — without replacing scholars, counselors, or local communities.',
  homeFollowingEmptyTitle: 'Nothing followed yet',
  homeFollowingEmptyDescription:
    'Follow channels from the Channels page to see duas here.',
  homeFollowingEmptyCta: 'Browse channels',
  homeFeedEmptyTitle: 'No duas yet',
  homeFeedEmptyDescription:
    'Be the first to share a dua with the community.',
  channelsPageSubtitle:
    'Follow channels to personalize your Following feed on Home.',
  donatePageTitle: 'Support DuaPrayer',
  donatePageIntro:
    'Optional donations help cover hosting and ongoing development so this community space stays available.',
  composerTitleEn: 'Share a dua',
  composerDescriptionEn:
    'Please do not include personal or private details. Posts may be reviewed.',
  composerPlaceholderEn:
    'Share a dua for yourself, your family, or someone who needs support...',
  composerCategoryPlaceholderEn: 'Topic',
  composerSubmitEn: 'Share dua',
  composerSubmittingEn: 'Sharing…',
  composerTitleAr: 'شارك دعاءك',
  composerDescriptionAr:
    'يرجى عدم تضمين تفاصيل شخصية أو خاصة. قد تتم مراجعة المشاركات.',
  composerPlaceholderAr: 'ادعُ لنفسك أو لأهلك أو لمن يحتاج إلى الدعم...',
  composerCategoryPlaceholderAr: 'التصنيف',
  composerSubmitAr: 'شارك الدعاء',
  composerSubmittingAr: 'جارٍ المشاركة...',
  composerCategoryFamilyAr: 'العائلة',
  composerCategoryForgivenessAr: 'المغفرة',
  composerCategoryGeneralAr: 'عام',
  composerCategoryHealthAr: 'الصحة',
  composerCategoryCommunityAr: 'المجتمع',
  composerCategoryGuidanceAr: 'الهداية',
  composerCategoryGratitudeAr: 'الشكر',
  composerCategoryProtectionAr: 'الحماية',
} as const;

export type SiteCopyKey = keyof typeof SITE_COPY_DEFAULTS;

export const SITE_COPY_SETTING_KEYS: Record<SiteCopyKey, string> = {
  footerTagline: 'copy.footer_tagline',
  authTagline: 'copy.auth_tagline',
  aboutMission: 'copy.about_mission',
  homeFollowingEmptyTitle: 'copy.home_following_empty_title',
  homeFollowingEmptyDescription: 'copy.home_following_empty_description',
  homeFollowingEmptyCta: 'copy.home_following_empty_cta',
  homeFeedEmptyTitle: 'copy.home_feed_empty_title',
  homeFeedEmptyDescription: 'copy.home_feed_empty_description',
  channelsPageSubtitle: 'copy.channels_page_subtitle',
  donatePageTitle: 'copy.donate_page_title',
  donatePageIntro: 'copy.donate_page_intro',
  composerTitleEn: 'copy.composer_title_en',
  composerDescriptionEn: 'copy.composer_description_en',
  composerPlaceholderEn: 'copy.composer_placeholder_en',
  composerCategoryPlaceholderEn: 'copy.composer_category_placeholder_en',
  composerSubmitEn: 'copy.composer_submit_en',
  composerSubmittingEn: 'copy.composer_submitting_en',
  composerTitleAr: 'copy.composer_title_ar',
  composerDescriptionAr: 'copy.composer_description_ar',
  composerPlaceholderAr: 'copy.composer_placeholder_ar',
  composerCategoryPlaceholderAr: 'copy.composer_category_placeholder_ar',
  composerSubmitAr: 'copy.composer_submit_ar',
  composerSubmittingAr: 'copy.composer_submitting_ar',
  composerCategoryFamilyAr: 'copy.composer_category_family_ar',
  composerCategoryForgivenessAr: 'copy.composer_category_forgiveness_ar',
  composerCategoryGeneralAr: 'copy.composer_category_general_ar',
  composerCategoryHealthAr: 'copy.composer_category_health_ar',
  composerCategoryCommunityAr: 'copy.composer_category_community_ar',
  composerCategoryGuidanceAr: 'copy.composer_category_guidance_ar',
  composerCategoryGratitudeAr: 'copy.composer_category_gratitude_ar',
  composerCategoryProtectionAr: 'copy.composer_category_protection_ar',
};

export type SiteCopy = Record<SiteCopyKey, string>;

export function mergeSiteCopy(
  rows: Array<{ key: string; value: string }>,
): SiteCopy {
  const map = new Map(rows.map((row) => [row.key, row.value]));
  const copy = { ...SITE_COPY_DEFAULTS } as SiteCopy;

  for (const [copyKey, settingKey] of Object.entries(
    SITE_COPY_SETTING_KEYS,
  ) as Array<[SiteCopyKey, string]>) {
    const value = map.get(settingKey)?.trim();
    if (value) copy[copyKey] = value;
  }

  return copy;
}
