export const arabicCharacterPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g
export const arabicTextSegmentPattern = /([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+)/g
export const latinCharacterPattern = /[A-Za-z]/
const latinScriptLetterPattern = /\p{Script=Latin}/u
const nonLatinLetterPattern = /(?!\p{Script=Latin})\p{Letter}/u
const latinScriptLanguages = new Set([
  "en",
  "eng",
  "english",
  "tr",
  "turkish",
  "fr",
  "french",
  "es",
  "spanish",
  "id",
  "indonesian",
  "ms",
  "may",
  "malay",
  "so",
  "somali",
  "ha",
  "hausa",
  "sw",
  "swa",
  "swahili",
])
const nonLatinScriptLanguages = new Set([
  "ar",
  "ara",
  "arabic",
  "ur",
  "urd",
  "urdu",
  "bn",
  "ben",
  "bengali",
  "fa",
  "per",
  "fas",
  "persian",
  "hi",
  "hin",
  "hindi",
])
export const arabicFontClassName = "font-arabic-dua"

export type DuaLanguage = "ar" | "en"
export type LanguageMode = "auto" | DuaLanguage

export function hasArabicText(text: string) {
  return Boolean(text.match(arabicCharacterPattern))
}

export function detectLanguage(text: string): DuaLanguage {
  const arabicCharacters = text.match(arabicCharacterPattern)?.length ?? 0
  return arabicCharacters >= 2 ? "ar" : "en"
}

export function getTextDirection(text: string): "ltr" | "rtl" {
  return detectLanguage(text) === "ar" ? "rtl" : "ltr"
}

export function getArabicOnlyFontClassName(text: string) {
  return hasArabicText(text) && !latinCharacterPattern.test(text) ? arabicFontClassName : ""
}

export function isLatinScriptLanguage(language: string | null | undefined, text = "") {
  const normalizedLanguage = language?.trim().toLowerCase()
  if (normalizedLanguage && latinScriptLanguages.has(normalizedLanguage)) return true
  if (normalizedLanguage && nonLatinScriptLanguages.has(normalizedLanguage)) return false

  return latinScriptLetterPattern.test(text) && !nonLatinLetterPattern.test(text)
}

export function resolveLanguage(mode: LanguageMode, text: string): DuaLanguage {
  if (mode === "ar" || mode === "en") return mode
  return detectLanguage(text)
}

export function resolveTextDirection(mode: LanguageMode, text: string): "ltr" | "rtl" {
  return resolveLanguage(mode, text) === "ar" ? "rtl" : "ltr"
}

export function resolveFontClassName(mode: LanguageMode, text: string) {
  const language = resolveLanguage(mode, text)
  if (language === "ar") return arabicFontClassName
  if (mode === "auto") return getArabicOnlyFontClassName(text)
  return ""
}
