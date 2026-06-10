"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, Copy, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AdminSection } from "@/components/admin/admin-section"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { cn } from "@/lib/utils"
import type { StripeSettingsAdminView } from "@/lib/stripe-settings-server"

type IntegrationWebhooksTabProps = {
  appUrl: string | null
  volunteerWebhookConfigured: boolean
  channelWebhookConfigured: boolean
  stripeSettings: StripeSettingsAdminView
}

function buildWebhookUrl(appUrl: string | null, path: string): string | null {
  if (!appUrl) return null
  return `${appUrl.replace(/\/$/, "")}${path}`
}

function CopyValueButton({ value, label = "Copy URL" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" className="shrink-0 rounded-full" onClick={handleCopy}>
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          {label}
        </>
      )}
    </Button>
  )
}

function WebhookUrlRow({ label, url }: { label: string; url: string | null }) {
  return (
    <div className="grid gap-2 border-b border-border/50 py-3 last:border-b-0 sm:grid-cols-[minmax(8rem,11rem)_1fr] sm:items-start sm:gap-x-6">
      <dt className="text-sm font-medium text-foreground">{label}</dt>
      <dd className="min-w-0 space-y-2">
        {url ? (
          <div className="flex flex-wrap items-start gap-2">
            <code className="min-w-0 flex-1 break-all rounded bg-muted px-1.5 py-0.5 text-xs">{url}</code>
            <CopyValueButton value={url} />
          </div>
        ) : (
          <code className="break-all rounded bg-muted px-1.5 py-0.5 text-xs">
            Set NEXT_PUBLIC_APP_URL to display full URL
          </code>
        )}
      </dd>
    </div>
  )
}

function SecretStatusRow({
  label,
  envVar,
  headerHint,
  configured,
}: {
  label: string
  envVar: string
  headerHint?: string
  configured: boolean
}) {
  return (
    <div className="grid gap-1 border-b border-border/50 py-3 last:border-b-0 sm:grid-cols-[minmax(8rem,11rem)_1fr] sm:gap-x-6">
      <dt className="text-sm font-medium text-foreground">{label}</dt>
      <dd className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <code className="break-all rounded bg-muted px-1.5 py-0.5 text-xs">{envVar}</code>
          <CopyValueButton value={envVar} label="Copy env key" />
        </div>
        {headerHint ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>
              Header: <code className="rounded bg-muted px-1 py-0.5">{headerHint}</code>
            </span>
            <CopyValueButton value={headerHint} label="Copy header" />
          </div>
        ) : null}
        <p className={cn("text-xs", configured ? "text-emerald-700" : "text-amber-800")}>
          {configured ? "Configured" : "Not configured — set this in Vercel Environment Variables."}
        </p>
      </dd>
    </div>
  )
}

export function IntegrationWebhooksTab({
  appUrl,
  volunteerWebhookConfigured,
  channelWebhookConfigured,
  stripeSettings,
}: IntegrationWebhooksTabProps) {
  const volunteerUrl = buildWebhookUrl(appUrl, "/api/webhooks/volunteer")
  const channelUrl = buildWebhookUrl(appUrl, "/api/webhooks/channel")
  const activeStripe = stripeSettings.mode === "test" ? stripeSettings.test : stripeSettings.live
  const stripeWebhookConfigured = activeStripe.hasWebhookSecret

  return (
    <div className="space-y-5">
      <AdminSection
        variant="plain"
        title="Volunteer applications"
        description="Fillout or custom integrations POST volunteer sign-ups here. Review pending rows in Admin → Volunteers."
        action={
          <AdminStatusBadge
            label={volunteerWebhookConfigured ? "Secret configured" : "Secret missing"}
            tone={volunteerWebhookConfigured ? "success" : "warning"}
          />
        }
      >
        <dl className="rounded-xl border border-border/60 bg-background px-5">
          <WebhookUrlRow label="POST URL" url={volunteerUrl} />
          <WebhookUrlRow
            label="Health check"
            url={volunteerUrl ? `${volunteerUrl} (GET)` : null}
          />
          <SecretStatusRow
            label="Secret"
            envVar="VOLUNTEER_WEBHOOK_SECRET"
            headerHint="X-Webhook-Secret: <secret>"
            configured={volunteerWebhookConfigured}
          />
        </dl>
        <ul className="mt-4 list-inside list-disc space-y-2 text-sm leading-6 text-muted-foreground">
          <li>Set the env var in your deployment (never commit it).</li>
          <li>
            Fillout&apos;s default payload (
            <code className="rounded bg-muted px-1 py-0.5 text-xs">submission.questions[]</code>) works without custom
            mapping.
          </li>
        </ul>
        <p className="mt-3">
          <Link
            href="https://github.com/mywebmasteruk/dua-prayer/blob/main/docs/volunteer-webhook.md"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-2 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Full volunteer webhook docs
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </p>
      </AdminSection>

      <AdminSection
        variant="plain"
        title="Channel applications"
        description="Fillout POSTs channel registration applications here. Approve or reject in Admin → Channels."
        action={
          <AdminStatusBadge
            label={channelWebhookConfigured ? "Secret configured" : "Secret missing"}
            tone={channelWebhookConfigured ? "success" : "warning"}
          />
        }
      >
        <dl className="rounded-xl border border-border/60 bg-background px-5">
          <WebhookUrlRow label="POST URL" url={channelUrl} />
          <WebhookUrlRow label="Health check" url={channelUrl ? `${channelUrl} (GET)` : null} />
          <SecretStatusRow
            label="Secret"
            envVar="CHANNEL_WEBHOOK_SECRET"
            headerHint="X-Webhook-Secret: <secret>"
            configured={channelWebhookConfigured}
          />
        </dl>
        <ul className="mt-4 list-inside list-disc space-y-2 text-sm leading-6 text-muted-foreground">
          <li>Include Email and Channel name questions at minimum in your Fillout form.</li>
          <li>
            Review submissions in{" "}
            <Link href="/admin/channels" className="font-medium text-primary underline-offset-2 hover:underline">
              Admin → Channels
            </Link>
            .
          </li>
        </ul>
        <p className="mt-3">
          <Link
            href="https://github.com/mywebmasteruk/dua-prayer/blob/main/docs/channel-webhook.md"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-2 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Full channel webhook docs
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </p>
      </AdminSection>

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
