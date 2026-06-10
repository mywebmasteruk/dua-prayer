export const FOUNDING_ADMIN_EMAIL = "webmaster@duaprayer.com"

export function isFoundingAdminEmail(email?: string | null): boolean {
  return email === FOUNDING_ADMIN_EMAIL
}
