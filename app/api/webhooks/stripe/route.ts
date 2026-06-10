import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { getStripe } from "@/lib/stripe"
import { getStripeWebhookSecret } from "@/lib/stripe-settings-server"

/**
 * Stripe webhook endpoint. Configure in the Stripe Dashboard:
 *   https://<your-domain>/api/webhooks/stripe
 * and store the signing secret (whsec_...) under Admin → Settings → Stripe
 * (or STRIPE_WEBHOOK_SECRET / STRIPE_TEST_WEBHOOK_SECRET env vars).
 *
 * Signature verification requires the RAW request body — do not parse JSON
 * before calling constructEvent.
 */
export async function POST(request: Request) {
  const stripe = await getStripe()
  const webhookSecret = await getStripeWebhookSecret()

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 })
  }

  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const rawBody = await request.text()
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error)
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object
        console.log("Stripe: checkout completed", {
          sessionId: session.id,
          mode: session.mode,
          amountTotal: session.amount_total,
          currency: session.currency,
          donationPackage: session.metadata?.donation_package_id ?? null,
          donationType: session.metadata?.donation_type ?? null,
        })
        break
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object
        console.warn("Stripe: recurring donation payment failed", {
          invoiceId: invoice.id,
          customer: invoice.customer,
          amountDue: invoice.amount_due,
          attemptCount: invoice.attempt_count,
        })
        break
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object
        console.log("Stripe: subscription updated", {
          subscriptionId: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        })
        break
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object
        console.log("Stripe: monthly donation canceled", {
          subscriptionId: subscription.id,
          donationPackage: subscription.metadata?.donation_package_id ?? null,
        })
        break
      }
      case "charge.refunded": {
        const charge = event.data.object
        console.log("Stripe: donation refunded", {
          chargeId: charge.id,
          amountRefunded: charge.amount_refunded,
        })
        break
      }
      default:
        // Acknowledge unhandled event types so Stripe stops retrying them.
        break
    }
  } catch (error) {
    // Returning 500 makes Stripe retry with backoff, which is what we want
    // for transient handler failures.
    console.error(`Stripe webhook handler error for ${event.type}:`, error)
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
