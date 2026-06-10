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
}

export type SiteCopy = Record<SiteCopyKey, string>

export type HomeEmptyCopy = Pick<
  SiteCopy,
  | "homeFeedEmptyTitle"
  | "homeFeedEmptyDescription"
  | "homeFollowingEmptyTitle"
  | "homeFollowingEmptyDescription"
  | "homeFollowingEmptyCta"
>
