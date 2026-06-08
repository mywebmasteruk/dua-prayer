import { NextResponse } from "next/server"
import { DONATION_AMOUNTS_USD, getStripe, isValidDonationAmount } from "@/lib/stripe"

export async function POST(request: Request) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json(
      {
        error:
          "Donations are temporarily unavailable. Add STRIPE_SECRET_KEY to your server environment to enable Stripe Checkout.",
      },
      { status: 503 },
    )
  }

  let amount: number
  try {
    const body = (await request.json()) as { amount?: unknown }
    amount = Number(body.amount)
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!Number.isFinite(amount) || !isValidDonationAmount(amount)) {
    return NextResponse.json(
      { error: `Choose one of the preset amounts: $${DONATION_AMOUNTS_USD.join(", $")}` },
      { status: 400 },
    )
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? new URL(request.url).origin

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "DuaPrayer Donation",
              description: "Voluntary support for the DuaPrayer community prayer platform",
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/donate?success=1`,
      cancel_url: `${baseUrl}/donate?canceled=1`,
      metadata: {
        donation_amount_usd: String(amount),
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
