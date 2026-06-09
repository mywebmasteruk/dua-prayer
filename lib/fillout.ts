const FILLOUT_HOST = "forms.fillout.com"

/** Origin used by Fillout's embed runtime for postMessage events (form_submit, etc.). */
export const FILLOUT_EMBED_ORIGIN = "https://embed.fillout.com"

export type FilloutEmbed = {
  src: string
}

/** Extract the form ID from a validated Fillout share or iframe src URL. */
export function extractFilloutFormId(src: string): string | null {
  try {
    const url = new URL(src)
    const match = url.pathname.match(/^\/t\/([a-zA-Z0-9_-]+)/)
    return match?.[1] ?? null
  } catch {
    return null
  }
}

/** Build the embed URL Fillout uses to postMessage submission events to the parent page. */
export function buildFilloutEmbedUrl(formId: string, embedId: string): string {
  const url = new URL(`${FILLOUT_EMBED_ORIGIN}/t/${encodeURIComponent(formId)}`)
  url.searchParams.set("fillout-embed-id", embedId)
  return url.toString()
}

function generateFilloutEmbedId(): string {
  const min = 1e13
  const max = 99_999_999_999_999
  return String(Math.floor(Math.random() * (max - min + 1)) + min)
}

export function createFilloutEmbedSession(formSrc: string): {
  iframeSrc: string
  embedId: string
  listensForSubmit: boolean
} | null {
  const formId = extractFilloutFormId(formSrc)
  if (!formId) return null

  const embedId = generateFilloutEmbedId()
  return {
    iframeSrc: buildFilloutEmbedUrl(formId, embedId),
    embedId,
    listensForSubmit: true,
  }
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
