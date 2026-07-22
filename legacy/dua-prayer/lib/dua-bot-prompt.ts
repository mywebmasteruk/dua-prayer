// Pure (client-safe) builder for the dua-bot editorial system prompt. This is the
// DEFAULT value of a bot's editable `system_prompt`; the engine uses the bot's
// own prompt when set, falling back to this when empty. The only thing the engine
// adds on top is a hidden technical output contract (RETRIEVE_OUTPUT_CONTRACT) —
// no other editorial rules are hardcoded, so the form fully controls behaviour.

function isArabic(language: string): boolean {
  return /arab|عرب/i.test(language)
}

export function defaultRetrieveSystemPrompt(opts: { language?: string | null; keywords?: string[] }): string {
  const language = opts.language?.trim() || "English"
  const arabic = isArabic(language)
  const keywords = (opts.keywords ?? []).map((k) => k.trim()).filter(Boolean)

  const languageRule = arabic
    ? "OUTPUT LANGUAGE: Arabic ONLY. Return just the Arabic script of the dua. Do NOT include any transliteration (romanized text) or English translation."
    : `OUTPUT LANGUAGE: ${language} ONLY. Return just the ${language} translation/meaning of the dua. Do NOT include Arabic script, and do NOT include romanized transliteration (e.g. 'Allahumma inni…'). Plain ${language} sentences only.`

  const hashtagRule = arabic
    ? "Provide ONE context-relevant hashtag of at least two meaningful Arabic words joined directly, with NO spaces, dashes, or underscores (e.g. #دعاءالرحمة), written in Arabic script."
    : `Provide ONE context-relevant hashtag of at least two meaningful ${language} words, each word Capitalized and joined directly (CamelCase, e.g. #ForgivenessDua), with NO spaces, dashes, or underscores.`

  return [
    "You extract ONE complete, well-known dua (Islamic supplication) from the provided web-page text.",
    "Copy the chosen-language text VERBATIM from the page — do not paraphrase, summarize, add, or remove words. If the page shows multiple language versions, take only the one for the required output language, exactly as written.",
    languageRule,
    "Pick a complete, self-contained dua (not a heading, fragment, or commentary). Prefer a widely-known authentic one.",
    keywords.length > 0
      ? `Prefer a dua whose theme relates to: ${keywords.join(", ")} — but any complete, well-known dua on the page is acceptable.`
      : "",
    "The dua text must contain ONLY the dua — no source, reference, citation, transliteration, hashtag, or other text.",
    "Exclude navigation text, ads, author commentary, and the words Amen/Ameen.",
    hashtagRule,
  ]
    .filter(Boolean)
    .join("\n")
}

// Hidden technical contract the engine always appends so the reply can be parsed.
// Not editorial — admins never need to write this.
export const RETRIEVE_OUTPUT_CONTRACT =
  'Return strict JSON only: {"dua": string, "hashtag": string}. If there is no complete dua in the required output language, return {"dua": "", "hashtag": ""}.'
