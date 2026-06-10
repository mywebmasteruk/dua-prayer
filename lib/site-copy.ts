import { SITE_SETTING_KEYS } from "@/lib/settings-keys"

export const SITE_COPY_DEFAULTS = {
  sidebarTagline: "Share your duas, pray for one another, and grow together in faith.",
  footerTagline:
    "A nonprofit community platform for sharing duas and responding with ameen — free for the Ummah.",
  aboutMission:
    "DuaPrayer is a nonprofit community platform where people share prayer requests and respond with ameen. We build simple, welcoming technology so collective duas can travel further — without replacing scholars, counselors, or local communities.",
  authTagline: "Share duas, support one another, and grow together in faith.",
  homeFollowingEmptyTitle: "Nothing followed yet",
  homeFollowingEmptyDescription: "Follow channels from the Channels page to see duas here.",
  homeFollowingEmptyCta: "Browse channels",
  homeFeedEmptyTitle: "No duas yet",
  homeFeedEmptyDescription: "Be the first to share a dua. Your words can lift someone across the Ummah.",
  channelsPageSubtitle: "Follow channels to personalize your Following feed on Home.",
  donatePageTitle: "Support DuaPrayer",
  donatePageIntro:
    "DuaPrayer is a nonprofit community platform for sharing duas and responding with ameen. Donations are optional and help cover hosting, moderation tools, and ongoing development so the service stays free for everyone.",
  composerTitleEn: "Share your dua with the Ummah.",
  composerDescriptionEn:
    "Please do not include personal or private details and keep it positive. All posts are subject to moderation. JZK",
  composerPlaceholderEn: "Make a dua for yourself, your family, or someone who needs support...",
  composerCategoryPlaceholderEn: "Category",
  composerSubmitEn: "Make",
  composerSubmitAriaEn: "Make Dua",
  composerSubmittingEn: "Making…",
  composerTitleAr: "شارك دعاءك مع الأمة.",
  composerDescriptionAr:
    "يرجى عدم تضمين تفاصيل شخصية أو خاصة، واجعل الدعاء إيجابيًا. تخضع جميع المشاركات للمراجعة. جزاكم الله خيرًا",
  composerPlaceholderAr: "ادعُ لنفسك أو لأهلك أو لمن يحتاج إلى الدعم...",
  composerCategoryPlaceholderAr: "التصنيف",
  composerSubmitAr: "ادعُ",
  composerSubmitAriaAr: "إرسال الدعاء",
  composerSubmittingAr: "جارٍ الإرسال...",
  composerCategoryFamilyAr: "العائلة",
  composerCategoryForgivenessAr: "المغفرة",
  composerCategoryGeneralAr: "عام",
  composerCategoryHealthAr: "الصحة",
  composerCategoryCommunityAr: "المجتمع",
  composerCategoryGuidanceAr: "الهداية",
  composerCategoryGratitudeAr: "الشكر",
  composerCategoryProtectionAr: "الحماية",
} as const

export type SiteCopyKey = keyof typeof SITE_COPY_DEFAULTS

export const SITE_SETTING_KEY_MAP: Record<SiteCopyKey, string> = {
  sidebarTagline: SITE_SETTING_KEYS.copySidebarTagline,
  footerTagline: SITE_SETTING_KEYS.copyFooterTagline,
  aboutMission: SITE_SETTING_KEYS.copyAboutMission,
  authTagline: SITE_SETTING_KEYS.copyAuthTagline,
  homeFollowingEmptyTitle: SITE_SETTING_KEYS.copyHomeFollowingEmptyTitle,
  homeFollowingEmptyDescription: SITE_SETTING_KEYS.copyHomeFollowingEmptyDescription,
  homeFollowingEmptyCta: SITE_SETTING_KEYS.copyHomeFollowingEmptyCta,
  homeFeedEmptyTitle: SITE_SETTING_KEYS.copyHomeFeedEmptyTitle,
  homeFeedEmptyDescription: SITE_SETTING_KEYS.copyHomeFeedEmptyDescription,
  channelsPageSubtitle: SITE_SETTING_KEYS.copyChannelsPageSubtitle,
  donatePageTitle: SITE_SETTING_KEYS.copyDonatePageTitle,
  donatePageIntro: SITE_SETTING_KEYS.copyDonatePageIntro,
  composerTitleEn: SITE_SETTING_KEYS.copyComposerTitleEn,
  composerDescriptionEn: SITE_SETTING_KEYS.copyComposerDescriptionEn,
  composerPlaceholderEn: SITE_SETTING_KEYS.copyComposerPlaceholderEn,
  composerCategoryPlaceholderEn: SITE_SETTING_KEYS.copyComposerCategoryPlaceholderEn,
  composerSubmitEn: SITE_SETTING_KEYS.copyComposerSubmitEn,
  composerSubmitAriaEn: SITE_SETTING_KEYS.copyComposerSubmitAriaEn,
  composerSubmittingEn: SITE_SETTING_KEYS.copyComposerSubmittingEn,
  composerTitleAr: SITE_SETTING_KEYS.copyComposerTitleAr,
  composerDescriptionAr: SITE_SETTING_KEYS.copyComposerDescriptionAr,
  composerPlaceholderAr: SITE_SETTING_KEYS.copyComposerPlaceholderAr,
  composerCategoryPlaceholderAr: SITE_SETTING_KEYS.copyComposerCategoryPlaceholderAr,
  composerSubmitAr: SITE_SETTING_KEYS.copyComposerSubmitAr,
  composerSubmitAriaAr: SITE_SETTING_KEYS.copyComposerSubmitAriaAr,
  composerSubmittingAr: SITE_SETTING_KEYS.copyComposerSubmittingAr,
  composerCategoryFamilyAr: SITE_SETTING_KEYS.copyComposerCategoryFamilyAr,
  composerCategoryForgivenessAr: SITE_SETTING_KEYS.copyComposerCategoryForgivenessAr,
  composerCategoryGeneralAr: SITE_SETTING_KEYS.copyComposerCategoryGeneralAr,
  composerCategoryHealthAr: SITE_SETTING_KEYS.copyComposerCategoryHealthAr,
  composerCategoryCommunityAr: SITE_SETTING_KEYS.copyComposerCategoryCommunityAr,
  composerCategoryGuidanceAr: SITE_SETTING_KEYS.copyComposerCategoryGuidanceAr,
  composerCategoryGratitudeAr: SITE_SETTING_KEYS.copyComposerCategoryGratitudeAr,
  composerCategoryProtectionAr: SITE_SETTING_KEYS.copyComposerCategoryProtectionAr,
}

export const SITE_COPY_LABELS: Record<SiteCopyKey, { label: string; description: string }> = {
  sidebarTagline: {
    label: "Sidebar tagline",
    description: "Short line under the logo in the left navigation.",
  },
  footerTagline: {
    label: "Footer tagline",
    description: "One-line description in the site footer.",
  },
  aboutMission: {
    label: "About mission",
    description: "Intro paragraph on the About page.",
  },
  authTagline: {
    label: "Auth pages tagline",
    description: "Short line under the logo on sign-in and password pages.",
  },
  homeFollowingEmptyTitle: {
    label: "Following tab — empty title",
    description: "Heading when the user has not followed any channels yet.",
  },
  homeFollowingEmptyDescription: {
    label: "Following tab — empty description",
    description: "Supporting text for the empty Following feed state.",
  },
  homeFollowingEmptyCta: {
    label: "Following tab — empty button",
    description: "Label on the button that links to the Channels page.",
  },
  homeFeedEmptyTitle: {
    label: "Home feed — empty title",
    description: "Heading when the public feed has no duas yet.",
  },
  homeFeedEmptyDescription: {
    label: "Home feed — empty description",
    description: "Supporting text for the empty home feed state.",
  },
  channelsPageSubtitle: {
    label: "Channels page subtitle",
    description: "Line under the Channels page heading.",
  },
  donatePageTitle: {
    label: "Donate page title",
    description: "Main heading on the Donate page.",
  },
  donatePageIntro: {
    label: "Donate page intro",
    description: "Intro paragraph below the Donate page title.",
  },
  composerTitleEn: {
    label: "Composer title — English",
    description: "Heading shown at the top of the dua composer modal in English mode.",
  },
  composerDescriptionEn: {
    label: "Composer description — English",
    description: "Moderation guidance shown below the composer heading in English mode.",
  },
  composerPlaceholderEn: {
    label: "Composer placeholder — English",
    description: "Placeholder shown inside the dua text field in English mode.",
  },
  composerCategoryPlaceholderEn: {
    label: "Composer category placeholder — English",
    description: "Placeholder shown before a category is selected in English mode.",
  },
  composerSubmitEn: {
    label: "Composer submit button — English",
    description: "Text on the composer submit button in English mode.",
  },
  composerSubmitAriaEn: {
    label: "Composer submit accessibility label — English",
    description: "Screen-reader label for the composer submit button in English mode.",
  },
  composerSubmittingEn: {
    label: "Composer submitting state — English",
    description: "Text shown on the composer submit button while sending in English mode.",
  },
  composerTitleAr: {
    label: "Composer title — Arabic",
    description: "Heading shown at the top of the dua composer modal in Arabic mode.",
  },
  composerDescriptionAr: {
    label: "Composer description — Arabic",
    description: "Moderation guidance shown below the composer heading in Arabic mode.",
  },
  composerPlaceholderAr: {
    label: "Composer placeholder — Arabic",
    description: "Placeholder shown inside the dua text field in Arabic mode.",
  },
  composerCategoryPlaceholderAr: {
    label: "Composer category placeholder — Arabic",
    description: "Placeholder shown before a category is selected in Arabic mode.",
  },
  composerSubmitAr: {
    label: "Composer submit button — Arabic",
    description: "Text on the composer submit button in Arabic mode.",
  },
  composerSubmitAriaAr: {
    label: "Composer submit accessibility label — Arabic",
    description: "Screen-reader label for the composer submit button in Arabic mode.",
  },
  composerSubmittingAr: {
    label: "Composer submitting state — Arabic",
    description: "Text shown on the composer submit button while sending in Arabic mode.",
  },
  composerCategoryFamilyAr: {
    label: "Composer category label — Arabic: Family",
    description: "Arabic label for the Family category in the composer category menu.",
  },
  composerCategoryForgivenessAr: {
    label: "Composer category label — Arabic: Forgiveness",
    description: "Arabic label for the Forgiveness category in the composer category menu.",
  },
  composerCategoryGeneralAr: {
    label: "Composer category label — Arabic: General",
    description: "Arabic label for the General category in the composer category menu.",
  },
  composerCategoryHealthAr: {
    label: "Composer category label — Arabic: Health",
    description: "Arabic label for the Health category in the composer category menu.",
  },
  composerCategoryCommunityAr: {
    label: "Composer category label — Arabic: Community",
    description: "Arabic label for the Community category in the composer category menu.",
  },
  composerCategoryGuidanceAr: {
    label: "Composer category label — Arabic: Guidance",
    description: "Arabic label for the Guidance category in the composer category menu.",
  },
  composerCategoryGratitudeAr: {
    label: "Composer category label — Arabic: Gratitude",
    description: "Arabic label for the Gratitude category in the composer category menu.",
  },
  composerCategoryProtectionAr: {
    label: "Composer category label — Arabic: Protection",
    description: "Arabic label for the Protection category in the composer category menu.",
  },
}

export type SiteCopy = Record<SiteCopyKey, string>

export type ComposerCopyKey = Extract<SiteCopyKey, `composer${string}`>
export type ComposerCopy = Pick<SiteCopy, ComposerCopyKey>
export type ComposerCategoryLabelLanguage = "auto" | "en" | "ar"

export const ARABIC_COMPOSER_CATEGORY_COPY_BY_NAME = {
  Family: "composerCategoryFamilyAr",
  Forgiveness: "composerCategoryForgivenessAr",
  General: "composerCategoryGeneralAr",
  Health: "composerCategoryHealthAr",
  Community: "composerCategoryCommunityAr",
  Guidance: "composerCategoryGuidanceAr",
  Gratitude: "composerCategoryGratitudeAr",
  Protection: "composerCategoryProtectionAr",
} as const satisfies Record<string, ComposerCopyKey>

export function getComposerCategoryLabel(
  categoryName: string,
  copy: ComposerCopy,
  language: ComposerCategoryLabelLanguage,
) {
  if (language !== "ar") return categoryName

  const copyKey = ARABIC_COMPOSER_CATEGORY_COPY_BY_NAME[
    categoryName as keyof typeof ARABIC_COMPOSER_CATEGORY_COPY_BY_NAME
  ]
  return copyKey ? copy[copyKey] : categoryName
}

export type HomeEmptyCopy = Pick<
  SiteCopy,
  | "homeFeedEmptyTitle"
  | "homeFeedEmptyDescription"
  | "homeFollowingEmptyTitle"
  | "homeFollowingEmptyDescription"
  | "homeFollowingEmptyCta"
>
