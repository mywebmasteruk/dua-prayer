import { SITE_SETTING_KEYS } from "@/lib/settings-keys"

export const SITE_COPY_DEFAULTS = {
  sidebarTagline: "Share duas, support one another, and grow together in faith.",
  footerTagline:
    "A nonprofit community platform for sharing duas and responding with ameen — free for the Ummah.",
  aboutMission:
    "DuaPrayer is a nonprofit community platform where people share prayer requests and respond with ameen. We build simple, welcoming technology so collective duas can travel further — without replacing scholars, counselors, or local communities.",
} as const

export type SiteCopyKey = keyof typeof SITE_COPY_DEFAULTS

export const SITE_SETTING_KEY_MAP: Record<SiteCopyKey, string> = {
  sidebarTagline: SITE_SETTING_KEYS.copySidebarTagline,
  footerTagline: SITE_SETTING_KEYS.copyFooterTagline,
  aboutMission: SITE_SETTING_KEYS.copyAboutMission,
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
}

export type SiteCopy = Record<SiteCopyKey, string>
