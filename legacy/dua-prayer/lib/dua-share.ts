export const DUA_SHARE_URL = "https://duaprayer.com"

const MAX_SHARE_TEXT_LENGTH = 320
const SHARE_SUFFIX = "Shared from DuaPrayer"

type ShareableDua = {
  id: number
  text: string
}

export type DuaSharePlatform = "whatsapp" | "telegram" | "twitter" | "facebook"

export type DuaSharePayload = {
  title: string
  text: string
  url: string
}

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ")
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value

  const truncated = value.slice(0, Math.max(0, maxLength - 1)).trimEnd()
  return `${truncated}…`
}

export function buildDuaSharePayload(dua: ShareableDua): DuaSharePayload {
  const duaText = normalizeWhitespace(dua.text)
  const availableDuaLength = Math.max(0, MAX_SHARE_TEXT_LENGTH - SHARE_SUFFIX.length - 2)
  const text = `${truncateText(duaText, availableDuaLength)}\n\n${SHARE_SUFFIX}`

  return {
    title: "DuaPrayer",
    text,
    url: DUA_SHARE_URL,
  }
}

export function buildDuaShareUrl(platform: DuaSharePlatform, dua: ShareableDua) {
  const payload = buildDuaSharePayload(dua)
  const text = encodeURIComponent(payload.text)
  const textWithUrl = encodeURIComponent(`${payload.text}\n\n${payload.url}`)
  const url = encodeURIComponent(payload.url)

  switch (platform) {
    case "whatsapp":
      return `https://wa.me/?text=${textWithUrl}`
    case "telegram":
      return `https://t.me/share/url?url=${url}&text=${text}`
    case "twitter":
      return `https://twitter.com/intent/tweet?text=${text}&url=${url}`
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`
    default: {
      const exhaustive: never = platform
      return exhaustive
    }
  }
}
