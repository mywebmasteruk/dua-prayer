import Stripe from "stripe"

let stripeClient: Stripe | null = null

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim())
}

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) return null

  if (!stripeClient) {
    stripeClient = new Stripe(key, {
      apiVersion: "2026-05-27.dahlia",
    })
  }

  return stripeClient
}

export const DONATION_AMOUNTS_USD = [5, 10, 25, 50, 100] as const

export type DonationAmountUsd = (typeof DONATION_AMOUNTS_USD)[number]

const DONATION_PRICE_ENV_KEYS: Record<DonationAmountUsd, string> = {
  5: "STRIPE_PRICE_DONATION_5",
  10: "STRIPE_PRICE_DONATION_10",
  25: "STRIPE_PRICE_DONATION_25",
  50: "STRIPE_PRICE_DONATION_50",
  100: "STRIPE_PRICE_DONATION_100",
}

export function isValidDonationAmount(amount: number): amount is DonationAmountUsd {
  return DONATION_AMOUNTS_USD.includes(amount as DonationAmountUsd)
}

export function getDonationPriceId(amount: DonationAmountUsd): string | null {
  const priceId = process.env[DONATION_PRICE_ENV_KEYS[amount]]?.trim()
  return priceId || null
}

export function areDonationPricesConfigured(): boolean {
  return DONATION_AMOUNTS_USD.every((amount) => Boolean(getDonationPriceId(amount)))
}

export function hasAppUrlConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_APP_URL?.trim())
}

/** True when server can create Stripe Checkout sessions for preset donation amounts. */
export function isDonationsReady(): boolean {
  return isStripeConfigured() && areDonationPricesConfigured() && hasAppUrlConfigured()
}

/** Dev/admin-only hint when checkout env is incomplete — never shown to public visitors when ready. */
export function shouldShowDonationSetupWarning(isAdmin: boolean): boolean {
  if (isDonationsReady()) return false
  return process.env.NODE_ENV === "development" || isAdmin
}
