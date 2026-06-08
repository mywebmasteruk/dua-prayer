export const SITE_SETTING_KEYS = {
  volunteerFilloutEmbed: "volunteer_fillout_embed",
} as const

export type SiteSettingKey = (typeof SITE_SETTING_KEYS)[keyof typeof SITE_SETTING_KEYS]
