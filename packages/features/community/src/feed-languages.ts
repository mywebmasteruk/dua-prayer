/** Languages a user can prefer for their feed (codes match duas.language). */
export const FEED_LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'Arabic' },
  { code: 'es', label: 'Spanish' },
  { code: 'ur', label: 'Urdu' },
  { code: 'fr', label: 'French' },
] as const;

export const FEED_LANGUAGE_CODES = FEED_LANGUAGE_OPTIONS.map(
  (option) => option.code,
);

export type FeedLanguageCode = (typeof FEED_LANGUAGE_OPTIONS)[number]['code'];

const ALLOWED = new Set<string>(FEED_LANGUAGE_CODES);

/** Empty array means “all languages”. */
export function parseFeedLanguages(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];

  const codes = raw
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim().toLowerCase())
    .filter((value) => ALLOWED.has(value));

  return [...new Set(codes)];
}

export function readFeedLanguagesFromPublicData(
  publicData: unknown,
): string[] {
  if (!publicData || typeof publicData !== 'object') return [];

  const record = publicData as Record<string, unknown>;

  return parseFeedLanguages(record.feed_languages);
}

/** Empty array means “all topics”. */
export function parseFeedTopics(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];

  return [
    ...new Set(
      raw
        .map((value) => {
          if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
            return value;
          }
          if (typeof value === 'string') {
            const parsed = Number.parseInt(value, 10);
            if (Number.isInteger(parsed) && parsed > 0) return parsed;
          }
          return null;
        })
        .filter((value): value is number => value != null),
    ),
  ];
}

export function readFeedTopicsFromPublicData(publicData: unknown): number[] {
  if (!publicData || typeof publicData !== 'object') return [];

  const record = publicData as Record<string, unknown>;

  return parseFeedTopics(record.feed_topics);
}
