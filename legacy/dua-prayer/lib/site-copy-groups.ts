import type { SiteCopyKey } from "@/lib/site-copy"

export type SiteCopySingleField = {
  type: "single"
  key: SiteCopyKey
}

export type SiteCopyTranslationField = {
  type: "translation"
  id: string
  label: string
  description: string
  enKey: SiteCopyKey
  arKey: SiteCopyKey
}

export type SiteCopyReferenceTranslationField = {
  type: "referenceTranslation"
  id: string
  label: string
  description: string
  englishText: string
  arKey: SiteCopyKey
}

export type SiteCopyField = SiteCopySingleField | SiteCopyTranslationField | SiteCopyReferenceTranslationField

export type SiteCopySection = {
  title: string
  description: string
  fields: readonly SiteCopyField[]
}

export type SiteCopyGroup = {
  value: string
  label: string
  description: string
  sections: readonly SiteCopySection[]
}

export const SITE_COPY_GROUPS = [
  {
    value: "home",
    label: "Home",
    description: "Empty states and calls to action on the Home feed.",
    sections: [
      {
        title: "Public feed empty state",
        description: "Shown when there are no public duas to display yet.",
        fields: [{ type: "single", key: "homeFeedEmptyTitle" }, { type: "single", key: "homeFeedEmptyDescription" }],
      },
      {
        title: "Following feed empty state",
        description: "Shown when a signed-in visitor has not followed any channels.",
        fields: [
          { type: "single", key: "homeFollowingEmptyTitle" },
          { type: "single", key: "homeFollowingEmptyDescription" },
          { type: "single", key: "homeFollowingEmptyCta" },
        ],
      },
    ],
  },
  {
    value: "composer",
    label: "Composer",
    description: "English and Arabic text shown while writing a dua.",
    sections: [
      {
        title: "Composer modal",
        description: "Edit matching English and Arabic text side by side.",
        fields: [
          {
            type: "translation",
            id: "composer-title",
            label: "Title",
            description: "Heading shown at the top of the dua composer modal.",
            enKey: "composerTitleEn",
            arKey: "composerTitleAr",
          },
          {
            type: "translation",
            id: "composer-description",
            label: "Description",
            description: "Moderation guidance shown below the composer heading.",
            enKey: "composerDescriptionEn",
            arKey: "composerDescriptionAr",
          },
          {
            type: "translation",
            id: "composer-placeholder",
            label: "Dua field placeholder",
            description: "Placeholder shown inside the dua text field.",
            enKey: "composerPlaceholderEn",
            arKey: "composerPlaceholderAr",
          },
          {
            type: "translation",
            id: "composer-category-placeholder",
            label: "Category placeholder",
            description: "Placeholder shown before a category is selected.",
            enKey: "composerCategoryPlaceholderEn",
            arKey: "composerCategoryPlaceholderAr",
          },
          {
            type: "translation",
            id: "composer-submit",
            label: "Submit button",
            description: "Text on the composer submit button.",
            enKey: "composerSubmitEn",
            arKey: "composerSubmitAr",
          },
          {
            type: "translation",
            id: "composer-submit-aria",
            label: "Submit accessibility label",
            description: "Screen-reader label for the composer submit button.",
            enKey: "composerSubmitAriaEn",
            arKey: "composerSubmitAriaAr",
          },
          {
            type: "translation",
            id: "composer-submitting",
            label: "Submitting state",
            description: "Text shown on the submit button while the dua is being sent.",
            enKey: "composerSubmittingEn",
            arKey: "composerSubmittingAr",
          },
        ],
      },
      {
        title: "Arabic category labels",
        description: "English category names are shown as references; edit the Arabic labels used in Arabic mode.",
        fields: [
          {
            type: "referenceTranslation",
            id: "category-family",
            label: "Family",
            description: "Category menu label.",
            englishText: "Family",
            arKey: "composerCategoryFamilyAr",
          },
          {
            type: "referenceTranslation",
            id: "category-forgiveness",
            label: "Forgiveness",
            description: "Category menu label.",
            englishText: "Forgiveness",
            arKey: "composerCategoryForgivenessAr",
          },
          {
            type: "referenceTranslation",
            id: "category-general",
            label: "General",
            description: "Category menu label.",
            englishText: "General",
            arKey: "composerCategoryGeneralAr",
          },
          {
            type: "referenceTranslation",
            id: "category-health",
            label: "Health",
            description: "Category menu label.",
            englishText: "Health",
            arKey: "composerCategoryHealthAr",
          },
          {
            type: "referenceTranslation",
            id: "category-community",
            label: "Community",
            description: "Category menu label.",
            englishText: "Community",
            arKey: "composerCategoryCommunityAr",
          },
          {
            type: "referenceTranslation",
            id: "category-guidance",
            label: "Guidance",
            description: "Category menu label.",
            englishText: "Guidance",
            arKey: "composerCategoryGuidanceAr",
          },
          {
            type: "referenceTranslation",
            id: "category-gratitude",
            label: "Gratitude",
            description: "Category menu label.",
            englishText: "Gratitude",
            arKey: "composerCategoryGratitudeAr",
          },
          {
            type: "referenceTranslation",
            id: "category-protection",
            label: "Protection",
            description: "Category menu label.",
            englishText: "Protection",
            arKey: "composerCategoryProtectionAr",
          },
        ],
      },
    ],
  },
  {
    value: "channels",
    label: "Channels",
    description: "Text on the Channels browsing page.",
    sections: [
      {
        title: "Channels page header",
        description: "Help visitors understand why following channels matters.",
        fields: [{ type: "single", key: "channelsPageSubtitle" }],
      },
    ],
  },
  {
    value: "auth",
    label: "Auth",
    description: "Sign-in and account access page copy.",
    sections: [
      {
        title: "Authentication pages",
        description: "Short reassurance shown under the logo on sign-in and password pages.",
        fields: [{ type: "single", key: "authTagline" }],
      },
    ],
  },
  {
    value: "pages",
    label: "Pages",
    description: "Standalone informational page copy.",
    sections: [
      {
        title: "About page",
        description: "Mission copy for visitors learning what DuaPrayer is.",
        fields: [{ type: "single", key: "aboutMission" }],
      },
      {
        title: "Donate page",
        description: "Donation page heading and intro copy.",
        fields: [{ type: "single", key: "donatePageTitle" }, { type: "single", key: "donatePageIntro" }],
      },
    ],
  },
  {
    value: "footer",
    label: "Footer",
    description: "Persistent layout text in navigation and footer areas.",
    sections: [
      {
        title: "Navigation and footer",
        description: "Short brand lines that appear across the site layout.",
        fields: [{ type: "single", key: "sidebarTagline" }, { type: "single", key: "footerTagline" }],
      },
    ],
  },
] as const satisfies readonly SiteCopyGroup[]

export function getSiteCopyGroupValues() {
  return SITE_COPY_GROUPS.map((group) => group.value)
}

export function getGroupedSiteCopyKeys() {
  return SITE_COPY_GROUPS.flatMap((group) =>
    group.sections.flatMap((section) =>
      section.fields.flatMap((field) => {
        switch (field.type) {
          case "single":
            return [field.key]
          case "translation":
            return [field.enKey, field.arKey]
          case "referenceTranslation":
            return [field.arKey]
          default: {
            const exhaustive: never = field
            return exhaustive
          }
        }
      }),
    ),
  )
}
