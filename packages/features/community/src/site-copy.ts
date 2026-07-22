export const SITE_COPY_DEFAULTS = {
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
  composerPlaceholderEn: 'Share a dua for yourself, your family, or someone who needs support...',
  composerSubmitEn: 'Share dua',
  composerSubmittingEn: 'Sharing…',
  composerTitleAr: 'شارك دعاءك',
  composerDescriptionAr:
    'يرجى عدم تضمين تفاصيل شخصية أو خاصة. قد تتم مراجعة المشاركات.',
  composerPlaceholderAr: 'ادعُ لنفسك أو لأهلك أو لمن يحتاج إلى الدعم...',
  composerSubmitAr: 'شارك الدعاء',
  composerSubmittingAr: 'جارٍ المشاركة...',
} as const;

export type SiteCopyKey = keyof typeof SITE_COPY_DEFAULTS;

export const SITE_COPY_SETTING_KEYS: Record<SiteCopyKey, string> = {
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
  composerSubmitEn: 'copy.composer_submit_en',
  composerSubmittingEn: 'copy.composer_submitting_en',
  composerTitleAr: 'copy.composer_title_ar',
  composerDescriptionAr: 'copy.composer_description_ar',
  composerPlaceholderAr: 'copy.composer_placeholder_ar',
  composerSubmitAr: 'copy.composer_submit_ar',
  composerSubmittingAr: 'copy.composer_submitting_ar',
};

export type SiteCopy = Record<SiteCopyKey, string>;

export function mergeSiteCopy(
  rows: Array<{ key: string; value: string }>,
): SiteCopy {
  const map = new Map(rows.map((row) => [row.key, row.value]));
  const copy = { ...SITE_COPY_DEFAULTS } as SiteCopy;

  for (const [copyKey, settingKey] of Object.entries(SITE_COPY_SETTING_KEYS) as Array<
    [SiteCopyKey, string]
  >) {
    const value = map.get(settingKey)?.trim();
    if (value) copy[copyKey] = value;
  }

  return copy;
}
