export const BOT_LANGUAGE_OPTIONS = [
  "English",
  "Arabic",
  "Urdu",
  "Turkish",
  "Bengali",
  "French",
  "Spanish",
  "Indonesian",
  "Malay",
  "Somali",
  "Persian",
  "Hindi",
  "Hausa",
  "Swahili",
] as const

export function getBotLanguageOptions(currentLanguage?: string): string[] {
  const normalizedCurrent = currentLanguage?.trim()
  if (!normalizedCurrent) return [...BOT_LANGUAGE_OPTIONS]

  const hasCurrent = BOT_LANGUAGE_OPTIONS.some(
    (language) => language.toLowerCase() === normalizedCurrent.toLowerCase(),
  )

  return hasCurrent ? [...BOT_LANGUAGE_OPTIONS] : [normalizedCurrent, ...BOT_LANGUAGE_OPTIONS]
}
