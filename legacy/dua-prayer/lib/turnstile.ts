export async function verifyTurnstile(token: string | null | undefined, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (!token) return false

  const body = new URLSearchParams({
    secret,
    response: token,
  })
  if (ip) body.set("remoteip", ip)

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    })

    const data = (await res.json()) as { success?: boolean }
    return !!data.success
  } catch (error) {
    // Fail closed: a siteverify outage should surface as a friendly
    // verification error, not an unhandled 500.
    console.error("Turnstile verification request failed:", error)
    return false
  }
}

export function isTurnstileEnabled(): boolean {
  return !!(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY)
}
