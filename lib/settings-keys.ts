export const SITE_SETTING_KEYS = {
  volunteerFilloutEmbed: "volunteer_fillout_embed",
  copySidebarTagline: "copy.sidebar_tagline",
  copyFooterTagline: "copy.footer_tagline",
  copyAboutMission: "copy.about_mission",
} as const

export type SiteSettingKey = (typeof SITE_SETTING_KEYS)[keyof typeof SITE_SETTING_KEYS]
