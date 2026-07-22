// In-memory fixed-window limiter. Scope: per server instance — on serverless
// the effective limit multiplies by instance count and resets on deploy.
// Acceptable at current traffic as a abuse speed bump (Turnstile is the
// primary gate); move to a shared store (e.g. Upstash) if limits must be
// exact across instances.
const buckets = new Map<string, { count: number; resetAt: number }>()

const WINDOW_MS = 60_000
const SWEEP_INTERVAL_MS = 5 * 60_000

let lastSweepAt = 0

function sweepExpired(now: number) {
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) return
  lastSweepAt = now
  for (const [key, entry] of buckets) {
    if (now >= entry.resetAt) buckets.delete(key)
  }
}

export function checkRateLimit(key: string, limit: number): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now()
  sweepExpired(now)

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
  // Prefer platform-set headers (Vercel) — the first x-forwarded-for entry is
  // client-controlled, so trusting it lets callers rotate fake IPs to bypass
  // rate limits.
  return (
    headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  )
}
