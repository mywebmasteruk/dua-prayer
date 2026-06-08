export function isSameOriginNavigationClick(event: MouseEvent, anchor: HTMLAnchorElement): boolean {
  if (!anchor.href) return false
  if (anchor.target === "_blank" || anchor.hasAttribute("download")) return false
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false
  if (anchor.getAttribute("aria-disabled") === "true") return false

  try {
    const url = new URL(anchor.href, window.location.href)
    if (url.origin !== window.location.origin) return false

    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
    const next = `${url.pathname}${url.search}${url.hash}`
    return current !== next
  } catch {
    return false
  }
}
