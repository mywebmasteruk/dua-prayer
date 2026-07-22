"use client"

import Link from "next/link"
import { AdminSection } from "@/components/admin/admin-section"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import type { StripeSettingsAdminView } from "@/lib/stripe-settings-server"

type IntegrationWebhooksTabProps = {
  stripeSettings: StripeSettingsAdminView
}

export function IntegrationWebhooksTab({ stripeSettings }: IntegrationWebhooksTabProps) {
  const activeStripe = stripeSettings.mode === "test" ? stripeSettings.test : stripeSettings.live
  const stripeWebhookConfigured = activeStripe.hasWebhookSecret

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Application forms now submit directly through the built-in{" "}
        <Link href="/admin/integration?tab=form-builder" className="font-medium text-primary underline-offset-2 hover:underline">
          Form builder
        </Link>
        {" "}— no external webhook endpoints are required.
      </p>

      <AdminSection
        variant="plain"
        title="Stripe donations (optional)"
        description="Signing secret for Stripe Dashboard webhooks. Managed in the Stripe tab — no inbound endpoint is required for one-time /donate checkout today."
        action={
          <AdminStatusBadge
            label={stripeWebhookConfigured ? "Secret configured" : "Not configured"}
            tone={stripeWebhookConfigured ? "success" : "neutral"}
          />
        }
      >
        <dl className="rounded-xl border border-border/60 bg-background px-5">
          <div className="grid gap-1 border-b border-border/50 py-3 sm:grid-cols-[minmax(8rem,11rem)_1fr] sm:gap-x-6">
            <dt className="text-sm font-medium text-foreground">Env fallback</dt>
            <dd>
              <code className="break-all rounded bg-muted px-1.5 py-0.5 text-xs">STRIPE_WEBHOOK_SECRET</code>
              <p className="mt-1 text-xs text-muted-foreground">
                Or save per-mode secrets in{" "}
                <Link href="/admin/integration?tab=stripe" className="font-medium text-primary underline-offset-2 hover:underline">
                  Integration → Stripe
                </Link>
                .
              </p>
            </dd>
          </div>
          <div className="grid gap-1 py-3 sm:grid-cols-[minmax(8rem,11rem)_1fr] sm:gap-x-6">
            <dt className="text-sm font-medium text-foreground">Active mode</dt>
            <dd className="text-sm text-muted-foreground">
              {stripeSettings.mode === "test" ? "Test" : "Live"} —{" "}
              {stripeWebhookConfigured
                ? `secret saved (…${activeStripe.webhookSecretLast4 ?? "****"})`
                : "no signing secret saved"}
            </dd>
          </div>
        </dl>
      </AdminSection>
    </div>
  )
}
