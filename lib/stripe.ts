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

export function isValidDonationAmount(amount: number): amount is DonationAmountUsd {
  return DONATION_AMOUNTS_USD.includes(amount as DonationAmountUsd)
}
