"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertTriangle, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { updateStripeSettings } from "@/app/actions/stripe-settings"
import type { StripeSettingsAdminView } from "@/lib/stripe-settings-server"

const STRIPE_DASHBOARD_KEYS_URL =
  "https://dashboard.stripe.com/acct_1NsPzqErjsRv8lCa/apikeys"

type StripeSettingsFormProps = {
  initial: StripeSettingsAdminView
}

function sourceHint(source: "db" | "env" | null) {
  if (source === "db") return "Saved in admin settings"
  if (source === "env") return "Loaded from environment variables"
  return null
}

export function StripeSettingsForm({ initial }: StripeSettingsFormProps) {
  const [secretKey, setSecretKey] = useState("")
  const [publishableKey, setPublishableKey] = useState(initial.publishableKey)
  const [webhookSecret, setWebhookSecret] = useState("")
  const [donationProductId, setDonationProductId] = useState(initial.donationProductId)
  const [isSaving, setIsSaving] = useState(false)
  const [view, setView] = useState(initial)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)

    const result = await updateStripeSettings({
      secretKey,
      publishableKey,
      webhookSecret,
      donationProductId,
    })

    if ("error" in result && result.error) {
      toast({
        title: "Could not save",
        description: result.error,
        variant: "destructive",
      })
    } else {
      setSecretKey("")
      setWebhookSecret("")
      setView((current) => ({
        ...current,
        hasSecretKey: Boolean(secretKey.trim()) || current.hasSecretKey,
        secretKeyLast4: secretKey.trim()
          ? secretKey.trim().slice(-4)
          : current.secretKeyLast4,
        secretKeySource: secretKey.trim() ? "db" : current.secretKeySource,
        publishableKey: publishableKey.trim(),
        publishableKeySource: publishableKey.trim() ? "db" : null,
        hasWebhookSecret: Boolean(webhookSecret.trim()) || current.hasWebhookSecret,
        webhookSecretLast4: webhookSecret.trim()
          ? webhookSecret.trim().slice(-4)
          : current.webhookSecretLast4,
        webhookSecretSource: webhookSecret.trim() ? "db" : current.webhookSecretSource,
        donationProductId: donationProductId.trim(),
        donationProductIdSource: donationProductId.trim() ? "db" : null,
        donationsReady: Boolean(secretKey.trim()) || current.hasSecretKey,
      }))
      toast({
        title: "Stripe settings saved",
        description: view.donationsReady || secretKey.trim()
          ? "Donations should be live on /donate after you refresh."
          : "Settings updated.",
      })
    }

    setIsSaving(false)
  }

  const handleClearSecret = async () => {
    setIsSaving(true)
    const result = await updateStripeSettings({ clearSecretKey: true })
    if ("error" in result && result.error) {
      toast({ title: "Could not clear secret key", description: result.error, variant: "destructive" })
    } else {
      setView((current) => ({
        ...current,
        hasSecretKey: false,
        secretKeyLast4: null,
        secretKeySource: null,
        donationsReady: false,
      }))
      toast({ title: "Secret key removed from admin settings" })
    }
    setIsSaving(false)
  }

  const handleClearWebhook = async () => {
    setIsSaving(true)
    const result = await updateStripeSettings({ clearWebhookSecret: true })
    if ("error" in result && result.error) {
      toast({ title: "Could not clear webhook secret", description: result.error, variant: "destructive" })
    } else {
      setView((current) => ({
        ...current,
        hasWebhookSecret: false,
        webhookSecretLast4: null,
        webhookSecretSource: null,
      }))
      toast({ title: "Webhook secret removed from admin settings" })
    }
    setIsSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div
        role="note"
        className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950"
      >
        <p className="flex items-start gap-2 font-semibold">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Live keys charge real money
        </p>
        <p className="mt-1">
          Use keys from the masjidweb.com Stripe account. Restricted keys (rk_live_) are recommended in
          production. Secrets are stored server-side in Supabase and never sent to browsers.
        </p>
        <a
          href={STRIPE_DASHBOARD_KEYS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-amber-950 underline-offset-2 hover:underline"
        >
          Stripe Dashboard → API keys
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>

      <div className="space-y-2">
        <Label htmlFor="stripe-secret-key">Secret key (required)</Label>
        <Input
          id="stripe-secret-key"
          type="password"
          autoComplete="off"
          value={secretKey}
          onChange={(event) => setSecretKey(event.target.value)}
          placeholder={view.hasSecretKey ? "Leave blank to keep current key" : "sk_live_… or rk_live_…"}
          className="font-mono text-xs"
        />
        {view.hasSecretKey ? (
          <p className="text-xs text-muted-foreground">
            Saved key ends in <span className="font-mono">{view.secretKeyLast4}</span>
            {sourceHint(view.secretKeySource) ? ` · ${sourceHint(view.secretKeySource)}` : null}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Paste from Stripe → Developers → API keys. Required to enable /donate checkout.
          </p>
        )}
        {view.secretKeySource === "db" ? (
          <Button type="button" variant="outline" size="sm" disabled={isSaving} onClick={handleClearSecret}>
            Remove saved secret key
          </Button>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="stripe-publishable-key">Publishable key (optional)</Label>
        <Input
          id="stripe-publishable-key"
          type="text"
          autoComplete="off"
          value={publishableKey}
          onChange={(event) => setPublishableKey(event.target.value)}
          placeholder="pk_live_…"
          className="font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground">
          For future client-side Stripe features. Checkout works without this today.
          {sourceHint(view.publishableKeySource) ? ` · ${sourceHint(view.publishableKeySource)}` : null}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="stripe-product-id">Donation product ID (optional)</Label>
        <Input
          id="stripe-product-id"
          type="text"
          value={donationProductId}
          onChange={(event) => setDonationProductId(event.target.value)}
          placeholder="prod_UfiS0mCPr50vv3"
          className="font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground">
          Groups donations under one product in Stripe. Checkout still uses dynamic amounts for monthly and
          one-time gifts.
          {sourceHint(view.donationProductIdSource) ? ` · ${sourceHint(view.donationProductIdSource)}` : null}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="stripe-webhook-secret">Webhook signing secret (optional)</Label>
        <Input
          id="stripe-webhook-secret"
          type="password"
          autoComplete="off"
          value={webhookSecret}
          onChange={(event) => setWebhookSecret(event.target.value)}
          placeholder={view.hasWebhookSecret ? "Leave blank to keep current secret" : "whsec_…"}
          className="font-mono text-xs"
        />
        {view.hasWebhookSecret ? (
          <p className="text-xs text-muted-foreground">
            Saved secret ends in <span className="font-mono">{view.webhookSecretLast4}</span>
            {sourceHint(view.webhookSecretSource) ? ` · ${sourceHint(view.webhookSecretSource)}` : null}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            From Stripe → Developers → Webhooks when you add a donation endpoint.
          </p>
        )}
        {view.webhookSecretSource === "db" ? (
          <Button type="button" variant="outline" size="sm" disabled={isSaving} onClick={handleClearWebhook}>
            Remove saved webhook secret
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            "Save Stripe settings"
          )}
        </Button>
        <Link
          href="/donate"
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Test donate page
        </Link>
      </div>

      <p className="text-xs leading-5 text-muted-foreground">
        Environment variables in <code className="rounded bg-muted px-1 py-0.5">.env.local</code> still work as
        fallback when a field is not saved here. Admin settings take precedence.
      </p>
    </form>
  )
}
