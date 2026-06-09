export const FOLLOWED_CHANNELS_STORAGE_KEY = "duaprayer-followed-channels"

export function parseFollowedChannelIds(raw: string | null): Set<number> {
  if (!raw) return new Set()

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()

    return new Set(parsed.filter((id): id is number => typeof id === "number" && Number.isInteger(id)))
  } catch {
    return new Set()
  }
}

export function serializeFollowedChannelIds(ids: Set<number>): string {
  return JSON.stringify([...ids].sort((a, b) => a - b))
}

export function loadFollowedChannelIds(): Set<number> {
  if (typeof window === "undefined") return new Set()
  return parseFollowedChannelIds(window.localStorage.getItem(FOLLOWED_CHANNELS_STORAGE_KEY))
}

export function saveFollowedChannelIds(ids: Set<number>) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(FOLLOWED_CHANNELS_STORAGE_KEY, serializeFollowedChannelIds(ids))
}
