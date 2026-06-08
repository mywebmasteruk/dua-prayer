const buckets = new Map<string, { count: number; resetAt: number }>()

const WINDOW_MS = 60_000

export function checkRateLimit(key: string, limit: number): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now()
  const entry = buckets.get(key)

  if (!entry || now >= entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true }
  }

  if (entry.count >= limit) {
    return { allowed: false, retryAfterMs: entry.resetAt - now }
  }

  entry.count += 1
  return { allowed: true }
}

export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  )
}
