import { SIGN_IN_QUERY } from "@/lib/auth-modal"

const AUTH_MODAL_PARAMS = [SIGN_IN_QUERY, "error", "reset", "next"] as const

export function stripAuthModalParams(params: URLSearchParams): URLSearchParams {
  const stripped = new URLSearchParams(params.toString())
  for (const key of AUTH_MODAL_PARAMS) stripped.delete(key)
  return stripped
}

/** True when pathname is unchanged and only auth-modal query params differ. */
export function isAuthModalOnlyNavigation(current: URL, next: URL): boolean {
  if (current.pathname !== next.pathname) return false
  if (current.hash !== next.hash) return false
  return (
    stripAuthModalParams(current.searchParams).toString() ===
    stripAuthModalParams(next.searchParams).toString()
  )
}

/** True when the URL opens the homepage auth modal. */
export function isSignInModalDestination(url: URL): boolean {
  const signin = url.searchParams.get("signin")
  return signin === "1" || signin === "true"
}

export function shouldStartNavigation(href: string | URL): boolean {
  try {
    const next = typeof href === "string" ? new URL(href, window.location.href) : href
    if (isSignInModalDestination(next)) return false
    const current = new URL(window.location.href)
    if (isAuthModalOnlyNavigation(current, next)) return false

    const currentRoute = `${current.pathname}${current.search}${current.hash}`
    const nextRoute = `${next.pathname}${next.search}${next.hash}`
    return currentRoute !== nextRoute
  } catch {
    return true
  }
}

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
