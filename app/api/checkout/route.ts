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
import type Stripe from "stripe"

export async function POST(request: Request) {
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

  try {
    const body = (await request.json()) as {
      amount?: unknown
      packageId?: unknown
      donationType?: unknown
    }
    amount = Number(body.amount)
    packageId = typeof body.packageId === "string" ? body.packageId : undefined
    if (body.donationType !== undefined) {
      if (!isDonationType(body.donationType)) {
        return NextResponse.json({ error: "Choose monthly or one-time giving." }, { status: 400 })
      }
      donationType = body.donationType
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
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
      ...(isMonthly
        ? {
            subscription_data: {
              metadata: {
                donation_amount_usd: String(amount),
                donation_package_id: donationPackage.id,
                donation_package_title: donationPackage.title,
                donation_type: donationType,
                product_name: "DuaPrayer Donation",
                source: "duaprayer_donate_page",
              },
            },
          }
        : {}),
      metadata: {
        donation_amount_usd: String(amount),
        donation_package_id: donationPackage.id,
        donation_package_title: donationPackage.title,
        donation_type: donationType,
        product_name: "DuaPrayer Donation",
        source: "duaprayer_donate_page",
      },
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
