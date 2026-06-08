const FILLOUT_HOST = "forms.fillout.com"

export type FilloutEmbed = {
  src: string
}

/**
 * Parse admin input into a safe Fillout iframe src URL.
 * Accepts: iframe HTML, share URL, or bare form ID.
 */
export function parseFilloutEmbed(input: string): FilloutEmbed | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const iframeSrcMatch = trimmed.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i)
  if (iframeSrcMatch?.[1]) {
    return validateFilloutUrl(iframeSrcMatch[1])
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return validateFilloutUrl(trimmed)
  }

  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return validateFilloutUrl(`https://${FILLOUT_HOST}/t/${trimmed}`)
  }

  return null
}

function validateFilloutUrl(rawUrl: string): FilloutEmbed | null {
  try {
    const url = new URL(rawUrl)
    if (url.protocol !== "https:") return null
    if (url.hostname !== FILLOUT_HOST) return null
    if (!/^\/t\/[a-zA-Z0-9_-]+/.test(url.pathname)) return null

    return { src: `https://${FILLOUT_HOST}${url.pathname}` }
  } catch {
    return null
  }
}
