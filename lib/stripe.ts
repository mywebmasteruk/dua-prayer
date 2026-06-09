import Stripe from "stripe"
import { getStripeSettings } from "@/lib/stripe-settings-server"

let stripeClientCache: { key: string; client: Stripe } | null = null

export async function resolveStripeSecretKey(): Promise<string | null> {
  const settings = await getStripeSettings()
  return settings.secretKey
}

export async function isStripeConfigured(): Promise<boolean> {
  return Boolean(await resolveStripeSecretKey())
}

export async function getStripe(): Promise<Stripe | null> {
  const key = await resolveStripeSecretKey()
  if (!key) return null

  if (!stripeClientCache || stripeClientCache.key !== key) {
    stripeClientCache = {
      key,
      client: new Stripe(key, {
        apiVersion: "2026-05-27.dahlia",
      }),
    }
  }

  return stripeClientCache.client
}

export const DONATION_PACKAGE_IDS = ["hosting", "development", "operations"] as const

export type DonationPackageId = (typeof DONATION_PACKAGE_IDS)[number]

export type DonationPackage = {
  id: DonationPackageId
  title: string
  description: string
  suggestedAmountUsd: number
}

export const DONATION_PACKAGES: readonly DonationPackage[] = [
  {
    id: "hosting",
    title: "Keep DuaPrayer online",
    description: "Help cover servers, databases, and security so prayer requests stay available around the clock.",
    suggestedAmountUsd: 25,
  },
  {
    id: "development",
    title: "Build what's next",
    description: "Support new features, accessibility, and a smoother experience for the whole community.",
    suggestedAmountUsd: 50,
  },
  {
    id: "operations",
    title: "Run the mission",
    description: "Help with admin essentials — operations, compliance, and the work behind a free platform.",
    suggestedAmountUsd: 15,
  },
] as const

export const MIN_DONATION_USD = 1
export const MAX_DONATION_USD = 10_000

export function isDonationPackageId(value: unknown): value is DonationPackageId {
  return typeof value === "string" && DONATION_PACKAGE_IDS.includes(value as DonationPackageId)
}

export function getDonationPackage(id: DonationPackageId): DonationPackage {
  const pkg = DONATION_PACKAGES.find((entry) => entry.id === id)
  if (!pkg) {
    throw new Error(`Unknown donation package: ${id}`)
  }
  return pkg
}

export function isValidDonationAmount(amount: number): boolean {
  return (
    Number.isInteger(amount) &&
    amount >= MIN_DONATION_USD &&
    amount <= MAX_DONATION_USD
  )
}

export function hasAppUrlConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_APP_URL?.trim())
}

export async function getDonationProductId(): Promise<string | null> {
  const settings = await getStripeSettings()
  return settings.donationProductId
}

export const DONATION_TYPES = ["monthly", "once"] as const

export type DonationType = (typeof DONATION_TYPES)[number]

export type DonationsUnavailableReason = "stripe_key" | "app_url"

export function isDonationType(value: unknown): value is DonationType {
  return typeof value === "string" && DONATION_TYPES.includes(value as DonationType)
}

export async function getDonationsStatus(): Promise<{
  ready: boolean
  reason?: DonationsUnavailableReason
}> {
  const stripeConfigured = await isStripeConfigured()

  if (stripeConfigured && hasAppUrlConfigured()) {
    return { ready: true }
  }

  if (!stripeConfigured) {
    return { ready: false, reason: "stripe_key" }
  }

  if (!hasAppUrlConfigured()) {
    return { ready: false, reason: "app_url" }
  }

  return { ready: false }
}

/** True when server can create Stripe Checkout sessions with dynamic amounts. */
export async function isDonationsReady(): Promise<boolean> {
  const status = await getDonationsStatus()
  return status.ready
}
