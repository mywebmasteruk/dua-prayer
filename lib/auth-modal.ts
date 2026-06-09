export const SIGN_IN_QUERY = "signin"

export type SignInSearchParams = {
  signin?: string
  error?: string
  reset?: string
  next?: string
}

export function isSignInOpen(params: SignInSearchParams | URLSearchParams): boolean {
  const signin = params instanceof URLSearchParams ? params.get(SIGN_IN_QUERY) : params.signin
  return signin === "1" || signin === "true"
}

/** Homepage URL that opens the sign-in modal. Use from any page's Sign in link. */
export function signInHref(options?: { next?: string; error?: string; reset?: string }): string {
  const params = new URLSearchParams()
  params.set(SIGN_IN_QUERY, "1")
  if (options?.next) params.set("next", options.next)
  if (options?.error) params.set("error", options.error)
  if (options?.reset) params.set("reset", options.reset)
  return `/?${params.toString()}`
}

/** Strip auth-modal query params while preserving feed filters (e.g. category). */
export function buildHomeUrlWithoutSignIn(searchParams: URLSearchParams): string {
  const params = new URLSearchParams(searchParams.toString())
  params.delete(SIGN_IN_QUERY)
  params.delete("error")
  params.delete("reset")
  params.delete("next")
  const qs = params.toString()
  return qs ? `/?${qs}` : "/"
}
