import type { ReactNode } from "react"

export type BannerRichTextSegment =
  | { type: "text"; text: string }
  | { type: "link"; text: string; href: string }

const LINK_PATTERN = /\[([^\[\]]+)\]\(([^\s()]+)\)/g
const SAFE_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export function sanitizeBannerColor(value: string | null | undefined, fallback = "#fef3c7") {
  const trimmed = value?.trim()
  return trimmed && SAFE_COLOR_PATTERN.test(trimmed) ? trimmed : fallback
}

export function isSafeBannerHref(href: string) {
  if (href.startsWith("/")) return !href.startsWith("//") && !href.startsWith("/\\")

  try {
    const url = new URL(href)
    return url.protocol === "https:" || url.protocol === "mailto:"
  } catch {
    return false
  }
}

export function parseBannerRichText(input: string): BannerRichTextSegment[] {
  const segments: BannerRichTextSegment[] = []
  let lastIndex = 0

  for (const match of input.matchAll(LINK_PATTERN)) {
    const [raw, text, href] = match
    const index = match.index ?? 0

    if (index > lastIndex) {
      segments.push({ type: "text", text: input.slice(lastIndex, index) })
    }

    const trimmedText = text.trim()
    const trimmedHref = href.trim()
    if (trimmedText && isSafeBannerHref(trimmedHref)) {
      segments.push({ type: "link", text: trimmedText, href: trimmedHref })
    } else {
      segments.push({ type: "text", text: raw })
    }

    lastIndex = index + raw.length
  }

  if (lastIndex < input.length) {
    segments.push({ type: "text", text: input.slice(lastIndex) })
  }

  return segments.length > 0 ? segments : [{ type: "text", text: input }]
}

export function renderBannerRichText(input: string): ReactNode {
  return parseBannerRichText(input).map((segment, index) => {
    if (segment.type === "text") return <span key={index}>{segment.text}</span>

    return (
      <a
        key={index}
        href={segment.href}
        className="font-semibold text-current no-underline transition-opacity hover:opacity-75 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2"
      >
        {segment.text}
      </a>
    )
  })
}
