import { createHash, timingSafeEqual } from "crypto"

/**
 * Constant-time string comparison for bearer secrets. Hashing both sides
 * first equalizes length, which timingSafeEqual requires.
 */
export function secretsMatch(provided: string, expected: string): boolean {
  const a = createHash("sha256").update(provided).digest()
  const b = createHash("sha256").update(expected).digest()
  return timingSafeEqual(a, b)
}
