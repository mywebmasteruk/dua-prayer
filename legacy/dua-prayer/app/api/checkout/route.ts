import { NextResponse } from "next/server"
import {
  getDonationPackage,
  getDonationProductId,
  getStripe,
  isDonationPackageId,
  isDonationType,
  isDonationsReady,
  isValidDonationAmount,
  MAX_DONATION_USD,
  MIN_DONATION_USD,
  type DonationType,
} from "@/lib/stripe"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { verifyTurnstile } from "@/lib/turnstile"
import type Stripe from "stripe"

const CHECKOUT_RATE_LIMIT_PER_MINUTE = 5

export async function POST(request: Request) {
  const ip = getClientIp(request.headers)
  const rate = checkRateLimit(`checkout:${ip}`, CHECKOUT_RATE_LIMIT_PER_MINUTE)
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please wait a minute and try again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rate.retryAfterMs ?? 60_000) / 1000)) } },
    )
  }

  const stripe = await getStripe()
  if (!stripe || !(await isDonationsReady())) {
    return NextResponse.json(
      {
        error: "Donations are temporarily unavailable. Please try again later.",
      },
      { status: 503 },
    )
  }

  let amount: number
  let packageId: string | undefined
  let donationType: DonationType = "monthly"
  let turnstileToken: string | null = null

  try {
    const body = (await request.json()) as {
      amount?: unknown
      packageId?: unknown
      donationType?: unknown
      turnstileToken?: unknown
    }
    amount = Number(body.amount)
    packageId = typeof body.packageId === "string" ? body.packageId : undefined
    turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken : null
    if (body.donationType !== undefined) {
      if (!isDonationType(body.donationType)) {
        return NextResponse.json({ error: "Choose monthly or one-time giving." }, { status: 400 })
      }
      donationType = body.donationType
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  // No-op when TURNSTILE_SECRET_KEY is not configured (matches createDua).
  if (!(await verifyTurnstile(turnstileToken, ip))) {
    return NextResponse.json(
      { error: "Verification failed. Please complete the check and try again." },
      { status: 400 },
    )
  }

  if (!Number.isFinite(amount) || !isValidDonationAmount(amount)) {
    return NextResponse.json(
      {
        error: `Enter a whole-dollar amount between $${MIN_DONATION_USD} and $${MAX_DONATION_USD.toLocaleString()}.`,
      },
      { status: 400 },
    )
  }

  if (!packageId || !isDonationPackageId(packageId)) {
    return NextResponse.json({ error: "Choose an impact area for your gift." }, { status: 400 })
  }

  const donationPackage = getDonationPackage(packageId)
  const productId = await getDonationProductId()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? new URL(request.url).origin
  const isMonthly = donationType === "monthly"

  const donationMetadata = {
    donation_amount_usd: String(amount),
    donation_package_id: donationPackage.id,
    donation_package_title: donationPackage.title,
    donation_type: donationType,
    product_name: "DuaPrayer Donation",
    source: "duaprayer_donate_page",
  }

  const priceData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData = {
    currency: "usd",
    unit_amount: amount * 100,
    ...(productId
      ? { product: productId }
      : {
          product_data: {
            name: `DuaPrayer — ${donationPackage.title}`,
            description: donationPackage.description,
          },
        }),
    ...(isMonthly ? { recurring: { interval: "month" } } : {}),
  }

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: priceData,
          quantity: 1,
        },
      ],
      mode: isMonthly ? "subscription" : "payment",
      success_url: `${baseUrl}/donate?success=1`,
      cancel_url: `${baseUrl}/donate?canceled=1`,
      // Attach metadata to the subscription (monthly) or the PaymentIntent
      // (one-time) so individual charges are traceable in Stripe reporting,
      // not just the checkout session.
      ...(isMonthly
        ? { subscription_data: { metadata: donationMetadata } }
        : { payment_intent_data: { metadata: donationMetadata } }),
      metadata: donationMetadata,
    })

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout URL" }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Stripe checkout session error:", error)
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 500 })
  }
}
