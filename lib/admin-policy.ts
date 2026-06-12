export const FOUNDING_ADMIN_EMAILS = [
  "webmaster@duaprayer.com",
  "mywebmasteruk@gmail.com",
] as const

/** @deprecated Prefer FOUNDING_ADMIN_EMAILS — kept for callers that need a primary display address. */
export const FOUNDING_ADMIN_EMAIL = FOUNDING_ADMIN_EMAILS[0]

export function isFoundingAdminEmail(email?: string | null): boolean {
  if (!email) return false
  return (FOUNDING_ADMIN_EMAILS as readonly string[]).includes(email)
}
