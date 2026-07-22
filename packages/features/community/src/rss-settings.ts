export type RssSettings = {
  enabled: boolean;
  itemCount: number;
  includeChannelPosts: boolean;
  includeFreeformDuas: boolean;
  onlyVerifiedChannels: boolean;
  /** Numeric channel (category) ids to exclude from the feed. */
  excludedChannelIds: number[];
};

export const RSS_DEFAULTS: RssSettings = {
  enabled: false,
  itemCount: 25,
  includeChannelPosts: true,
  includeFreeformDuas: true,
  onlyVerifiedChannels: false,
  excludedChannelIds: [],
};

export const RSS_SETTING_KEYS = {
  enabled: 'rss.enabled',
  itemCount: 'rss.item_count',
  includeChannelPosts: 'rss.include_channel_posts',
  includeFreeformDuas: 'rss.include_freeform_duas',
  onlyVerifiedChannels: 'rss.only_verified_channels',
  excludedChannelIds: 'rss.excluded_channel_ids',
} as const;

export const RSS_SETTING_KEY_LIST = Object.values(RSS_SETTING_KEYS);

export function parseBoolSetting(
  value: string | null | undefined,
  fallback: boolean,
) {
  if (value == null) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }
  return fallback;
}

export function parseItemCount(value: string | null | undefined) {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed)) return RSS_DEFAULTS.itemCount;
  return Math.min(50, Math.max(5, parsed));
}

export function parseExcludedChannelIds(value: string | null | undefined) {
  if (!value?.trim()) return [] as number[];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];

    return [
      ...new Set(
        parsed
          .map((item) => {
            if (typeof item === 'number' && Number.isInteger(item) && item > 0) {
              return item;
            }
            if (typeof item === 'string') {
              const asNumber = Number.parseInt(item, 10);
              if (Number.isInteger(asNumber) && asNumber > 0) return asNumber;
            }
            return null;
          })
          .filter((item): item is number => item != null),
      ),
    ];
  } catch {
    return [];
  }
}

export function parseRssSettings(
  rows: Array<{ key: string; value: string | null }>,
): RssSettings {
  const map = new Map(rows.map((row) => [row.key, row.value ?? '']));

  return {
    enabled: parseBoolSetting(
      map.get(RSS_SETTING_KEYS.enabled),
      RSS_DEFAULTS.enabled,
    ),
    itemCount: parseItemCount(map.get(RSS_SETTING_KEYS.itemCount)),
    includeChannelPosts: parseBoolSetting(
      map.get(RSS_SETTING_KEYS.includeChannelPosts),
      RSS_DEFAULTS.includeChannelPosts,
    ),
    includeFreeformDuas: parseBoolSetting(
      map.get(RSS_SETTING_KEYS.includeFreeformDuas),
      RSS_DEFAULTS.includeFreeformDuas,
    ),
    onlyVerifiedChannels: parseBoolSetting(
      map.get(RSS_SETTING_KEYS.onlyVerifiedChannels),
      RSS_DEFAULTS.onlyVerifiedChannels,
    ),
    excludedChannelIds: parseExcludedChannelIds(
      map.get(RSS_SETTING_KEYS.excludedChannelIds),
    ),
  };
}
