/**
 * Sanitize a post-auth redirect target. Only same-origin paths are allowed:
 * must start with exactly one "/" (rejects absolute URLs, "//host", "/\host").
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next) return "/"
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/"
  return next
}
