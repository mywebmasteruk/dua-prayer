import { detectLanguage } from "@/lib/detect-language"

export interface Hashtag {
  tag: string
  label: string
}

export interface TrendingHashtag extends Hashtag {
  duas: number
  ameens: number
}

const MAX_HASHTAGS_PER_DUA = 6
const MAX_HASHTAG_LENGTH = 40
const HASHTAG_PATTERN = /(^|[^\p{L}\p{N}_])#([\p{L}\p{N}][\p{L}\p{N}_-]{0,39})/gu
const EDGE_PUNCTUATION_PATTERN = /^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu

export function normalizeHashtag(value: string) {
  return value
    .normalize("NFKC")
    .replace(EDGE_PUNCTUATION_PATTERN, "")
    .replace(/_/g, "-")
    .toLowerCase()
    .slice(0, MAX_HASHTAG_LENGTH)
}

export function extractHashtags(text: string): Hashtag[] {
  const seen = new Set<string>()
  const hashtags: Hashtag[] = []

  for (const match of text.matchAll(HASHTAG_PATTERN)) {
    const rawTag = match[2]
    if (!rawTag) continue

    const tag = normalizeHashtag(rawTag)
    if (!tag || seen.has(tag)) continue

    seen.add(tag)
    hashtags.push({ tag, label: `#${tag}` })

    if (hashtags.length >= MAX_HASHTAGS_PER_DUA) break
  }

  return hashtags
}

export function getTopHashtags(text: string, limit = 3): Hashtag[] {
  return extractHashtags(text).slice(0, limit)
}

export function matchesHashtag(text: string, tag: string) {
  const normalizedTag = normalizeHashtag(tag)
  if (!normalizedTag) return true

  return extractHashtags(text).some((hashtag) => hashtag.tag === normalizedTag)
}

export function buildTrendingHashtags(
  duas: Array<{ text: string; likes: number }>,
  limit = 5,
): TrendingHashtag[] {
  const counts = new Map<string, TrendingHashtag>()

  for (const dua of duas) {
    for (const hashtag of extractHashtags(dua.text)) {
      const current = counts.get(hashtag.tag) ?? { ...hashtag, duas: 0, ameens: 0 }
      counts.set(hashtag.tag, {
        ...current,
        duas: current.duas + 1,
        ameens: current.ameens + dua.likes,
      })
    }
  }

  return [...counts.values()]
    .sort((a, b) => b.duas - a.duas || b.ameens - a.ameens || a.tag.localeCompare(b.tag))
    .slice(0, limit)
}

export type TrendingByLanguage = Record<"all" | "en" | "ar" | "es" | "ur" | "fr", TrendingHashtag[]>

// Trending hashtags overall and per language, so the feed's language pills can
// filter the trending rail. Language comes from the stored `language` code,
// falling back to script detection (en/ar only) for legacy rows.
export function buildTrendingByLanguage(
  duas: Array<{ text: string; likes: number; language?: string | null }>,
  limit = 5,
): TrendingByLanguage {
  const code = (dua: { text: string; language?: string | null }) =>
    dua.language?.trim().toLowerCase() || detectLanguage(dua.text)
  const forLang = (lang: string) => buildTrendingHashtags(duas.filter((d) => code(d) === lang), limit)
  return {
    all: buildTrendingHashtags(duas, limit),
    en: forLang("en"),
    ar: forLang("ar"),
    es: forLang("es"),
    ur: forLang("ur"),
    fr: forLang("fr"),
  }
}
