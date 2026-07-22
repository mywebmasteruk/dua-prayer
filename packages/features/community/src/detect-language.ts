const arabicCharacterPattern =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;

export type DuaLanguage = 'ar' | 'en';

export function detectLanguage(text: string): DuaLanguage {
  const arabicCharacters = text.match(arabicCharacterPattern)?.length ?? 0;

  return arabicCharacters >= 2 ? 'ar' : 'en';
}

export function getTextDirection(text: string): 'ltr' | 'rtl' {
  return detectLanguage(text) === 'ar' ? 'rtl' : 'ltr';
}
