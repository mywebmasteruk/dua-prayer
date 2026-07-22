/**
 * Sanitize a post-auth redirect target. Only same-origin paths are allowed:
 * must start with exactly one "/" (rejects absolute URLs, "//host", "/\host").
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next) return "/"
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/"

  const url = new URL(next, "https://duaprayer.local")
  url.searchParams.delete("signin")
  url.searchParams.delete("code")
  url.searchParams.delete("error")
  url.searchParams.delete("error_code")
  url.searchParams.delete("error_description")

  return `${url.pathname}${url.search}${url.hash}`
}
