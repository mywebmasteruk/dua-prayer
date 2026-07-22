"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertTriangle, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { AdminSection } from "@/components/admin/admin-section"
import { updateStripeSettings } from "@/app/actions/stripe-settings"
import type { StripeCredentialAdminView, StripeSettingsAdminView } from "@/lib/stripe-settings-server"
import type { StripeMode } from "@/lib/settings-keys"
import { cn } from "@/lib/utils"

const STRIPE_DASHBOARD_KEYS_URL =
  "https://dashboard.stripe.com/acct_1NsPzqErjsRv8lCa/apikeys"

type IntegrationStripeTabProps = {
  initial: StripeSettingsAdminView
}

type CredentialFormState = {
  secretKey: string
  publishableKey: string
  webhookSecret: string
  donationProductId: string
}

function sourceHint(source: "db" | "env" | null) {
  if (source === "db") return "Saved in admin settings"
  if (source === "env") return "Loaded from environment variables"
  return null
}

function emptyFormState(credentials: StripeCredentialAdminView): CredentialFormState {
  return {
    secretKey: "",
    publishableKey: credentials.publishableKey,
    webhookSecret: "",
    donationProductId: credentials.donationProductId,
  }
}

function CredentialFields({
  mode,
  label,
  view,
  form,
  onChange,
  isSaving,
  onClearSecret,
  onClearWebhook,
}: {
  mode: StripeMode
  label: string
  view: StripeCredentialAdminView
  form: CredentialFormState
  onChange: (next: CredentialFormState) => void
  isSaving: boolean
  onClearSecret: () => void
  onClearWebhook: () => void
}) {
  const secretPlaceholder =
    mode === "test"
      ? view.hasSecretKey
        ? "Leave blank to keep current test key"
        : "sk_test_… or rk_test_…"
      : view.hasSecretKey
        ? "Leave blank to keep current live key"
        : "sk_live_… or rk_live_…"

  const publishablePlaceholder = mode === "test" ? "pk_test_…" : "pk_live_…"

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium",
            view.ready
              ? "bg-emerald-100 text-emerald-800"
              : "bg-muted text-muted-foreground",
          )}
        >
          {view.ready ? "Keys configured" : "Missing secret key"}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(8rem,11rem)_1fr] sm:items-start sm:gap-x-6">
        <Label htmlFor={`${mode}-secret-key`} className="sm:pt-2.5">
          Secret key
        </Label>
        <div className="space-y-1.5">
          <Input
            id={`${mode}-secret-key`}
            type="password"
            autoComplete="off"
            value={form.secretKey}
            onChange={(event) => onChange({ ...form, secretKey: event.target.value })}
            placeholder={secretPlaceholder}
            className="font-mono text-xs"
          />
          {view.hasSecretKey ? (
            <p className="text-xs text-muted-foreground">
              Saved key ends in <span className="font-mono">{view.secretKeyLast4}</span>
              {sourceHint(view.secretKeySource) ? ` · ${sourceHint(view.secretKeySource)}` : null}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Required for {mode} checkout. Paste from Stripe Dashboard → Developers → API keys.
            </p>
          )}
          {view.secretKeySource === "db" ? (
            <Button type="button" variant="outline" size="sm" disabled={isSaving} onClick={onClearSecret}>
              Remove saved secret key
            </Button>
          ) : null}
        </div>

        <Label htmlFor={`${mode}-publishable-key`} className="sm:pt-2.5">
          Publishable key
        </Label>
        <div className="space-y-1.5">
          <Input
            id={`${mode}-publishable-key`}
            type="text"
            autoComplete="off"
            value={form.publishableKey}
            onChange={(event) => onChange({ ...form, publishableKey: event.target.value })}
            placeholder={publishablePlaceholder}
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            Optional — for future client-side Stripe features.
            {sourceHint(view.publishableKeySource) ? ` · ${sourceHint(view.publishableKeySource)}` : null}
          </p>
        </div>

        <Label htmlFor={`${mode}-product-id`} className="sm:pt-2.5">
          Donation product ID
        </Label>
        <div className="space-y-1.5">
          <Input
            id={`${mode}-product-id`}
            type="text"
            value={form.donationProductId}
            onChange={(event) => onChange({ ...form, donationProductId: event.target.value })}
            placeholder="prod_…"
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            Optional — groups donations under one product in Stripe.
            {sourceHint(view.donationProductIdSource) ? ` · ${sourceHint(view.donationProductIdSource)}` : null}
          </p>
        </div>

        <Label htmlFor={`${mode}-webhook-secret`} className="sm:pt-2.5">
          Webhook secret
        </Label>
        <div className="space-y-1.5">
          <Input
            id={`${mode}-webhook-secret`}
            type="password"
            autoComplete="off"
            value={form.webhookSecret}
            onChange={(event) => onChange({ ...form, webhookSecret: event.target.value })}
            placeholder={view.hasWebhookSecret ? "Leave blank to keep current secret" : "whsec_…"}
            className="font-mono text-xs"
          />
          {view.hasWebhookSecret ? (
            <p className="text-xs text-muted-foreground">
              Saved secret ends in <span className="font-mono">{view.webhookSecretLast4}</span>
              {sourceHint(view.webhookSecretSource) ? ` · ${sourceHint(view.webhookSecretSource)}` : null}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Optional — from Stripe → Developers → Webhooks.</p>
          )}
          {view.webhookSecretSource === "db" ? (
            <Button type="button" variant="outline" size="sm" disabled={isSaving} onClick={onClearWebhook}>
              Remove saved webhook secret
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function IntegrationStripeTab({ initial }: IntegrationStripeTabProps) {
  const [checkoutMode, setCheckoutMode] = useState<StripeMode>(initial.mode)
  const [view, setView] = useState(initial)
  const [liveForm, setLiveForm] = useState(() => emptyFormState(initial.live))
  const [testForm, setTestForm] = useState(() => emptyFormState(initial.test))
  const [isSaving, setIsSaving] = useState(false)

  const handleModeToggle = async (useTestMode: boolean) => {
    const nextMode: StripeMode = useTestMode ? "test" : "live"
    setCheckoutMode(nextMode)
    setIsSaving(true)

    const result = await updateStripeSettings({ mode: nextMode })
    if ("error" in result && result.error) {
      setCheckoutMode(view.mode)
      toast({ title: "Could not update mode", description: result.error, variant: "destructive" })
    } else {
      setView((current) => ({
        ...current,
        mode: nextMode,
        donationsReady: nextMode === "test" ? current.test.ready : current.live.ready,
        activeModeReady: nextMode === "test" ? current.test.ready : current.live.ready,
      }))
      toast({
        title: nextMode === "test" ? "Test mode enabled" : "Live mode enabled",
        description:
          nextMode === "test"
            ? "/donate checkout will use test keys — no real charges."
            : "/donate checkout will use live keys — real payments.",
      })
    }
    setIsSaving(false)
  }

  const buildCredentialPayload = (mode: StripeMode, form: CredentialFormState) => ({
    secretKey: form.secretKey,
    publishableKey: form.publishableKey,
    webhookSecret: form.webhookSecret,
    donationProductId: form.donationProductId,
  })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)

    const result = await updateStripeSettings({
      mode: checkoutMode,
      live: buildCredentialPayload("live", liveForm),
      test: buildCredentialPayload("test", testForm),
    })

    if ("error" in result && result.error) {
      toast({ title: "Could not save", description: result.error, variant: "destructive" })
    } else {
      setLiveForm((form) => ({ ...form, secretKey: "", webhookSecret: "" }))
      setTestForm((form) => ({ ...form, secretKey: "", webhookSecret: "" }))
      setView((current) => {
        const nextLive = { ...current.live }
        const nextTest = { ...current.test }

        if (liveForm.secretKey.trim()) {
          nextLive.hasSecretKey = true
          nextLive.secretKeyLast4 = liveForm.secretKey.trim().slice(-4)
          nextLive.secretKeySource = "db"
          nextLive.ready = true
        }
        if (testForm.secretKey.trim()) {
          nextTest.hasSecretKey = true
          nextTest.secretKeyLast4 = testForm.secretKey.trim().slice(-4)
          nextTest.secretKeySource = "db"
          nextTest.ready = true
        }

        const activeModeReady = checkoutMode === "test" ? nextTest.ready : nextLive.ready

        return {
          ...current,
          mode: checkoutMode,
          live: nextLive,
          test: nextTest,
          donationsReady: activeModeReady,
          activeModeReady,
        }
      })
      toast({ title: "Stripe settings saved", description: "Integration credentials updated." })
    }

    setIsSaving(false)
  }

  const handleClearSecret = async (mode: StripeMode) => {
    setIsSaving(true)
    const payload = mode === "live" ? { live: { clearSecretKey: true } } : { test: { clearSecretKey: true } }
    const result = await updateStripeSettings(payload)
    if ("error" in result && result.error) {
      toast({ title: "Could not clear secret key", description: result.error, variant: "destructive" })
    } else {
      setView((current) => {
        const credentials = mode === "live" ? { ...current.live } : { ...current.test }
        credentials.hasSecretKey = false
        credentials.secretKeyLast4 = null
        credentials.secretKeySource = null
        credentials.ready = false
        const next = mode === "live" ? { ...current, live: credentials } : { ...current, test: credentials }
        const activeModeReady = checkoutMode === "test" ? next.test.ready : next.live.ready
        return { ...next, donationsReady: activeModeReady, activeModeReady }
      })
      toast({ title: `${mode === "live" ? "Live" : "Test"} secret key removed` })
    }
    setIsSaving(false)
  }

  const handleClearWebhook = async (mode: StripeMode) => {
    setIsSaving(true)
    const payload = mode === "live" ? { live: { clearWebhookSecret: true } } : { test: { clearWebhookSecret: true } }
    const result = await updateStripeSettings(payload)
    if ("error" in result && result.error) {
      toast({ title: "Could not clear webhook secret", description: result.error, variant: "destructive" })
    } else {
      setView((current) => {
        const credentials = mode === "live" ? { ...current.live } : { ...current.test }
        credentials.hasWebhookSecret = false
        credentials.webhookSecretLast4 = null
        credentials.webhookSecretSource = null
        return mode === "live" ? { ...current, live: credentials } : { ...current, test: credentials }
      })
      toast({ title: `${mode === "live" ? "Live" : "Test"} webhook secret removed` })
    }
    setIsSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {checkoutMode === "test" ? (
        <div
          role="alert"
          className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950"
        >
          <p className="flex items-start gap-2 font-semibold">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Test mode is active for /donate
          </p>
          <p className="mt-1">
            Checkout uses Stripe test keys. Use test card numbers — no real money is charged.
          </p>
        </div>
      ) : (
        <div
          role="note"
          className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950"
        >
          <p className="flex items-start gap-2 font-semibold">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Live mode charges real money
          </p>
          <p className="mt-1">
            When live mode is selected, /donate checkout uses live Stripe keys. Restricted keys (rk_live_) are
            recommended in production.
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
      )}

      <AdminSection
        title="Checkout mode"
        description={
          checkoutMode === "test"
            ? "Visitors on /donate will complete checkout with test keys."
            : "Visitors on /donate will complete checkout with live keys."
        }
        action={
          <div className="flex items-center gap-3">
            <Label htmlFor="stripe-checkout-mode" className="text-sm font-normal text-muted-foreground">
              {checkoutMode === "test" ? "Test" : "Live"}
            </Label>
            <Switch
              id="stripe-checkout-mode"
              checked={checkoutMode === "test"}
              disabled={isSaving}
              onCheckedChange={handleModeToggle}
              aria-label="Use Stripe test mode for checkout"
            />
            <span className="text-xs text-muted-foreground">Test mode</span>
          </div>
        }
        contentClassName="pt-0"
      />

      <AdminSection
        title="Live credentials"
        description="Production keys for real donations on /donate when live mode is active."
        contentClassName="pt-0"
      >
        <CredentialFields
          mode="live"
          label="Live keys"
          view={view.live}
          form={liveForm}
          onChange={setLiveForm}
          isSaving={isSaving}
          onClearSecret={() => handleClearSecret("live")}
          onClearWebhook={() => handleClearWebhook("live")}
        />
      </AdminSection>

      <AdminSection
        title="Test credentials"
        description="Sandbox keys for safe checkout testing when test mode is active."
        contentClassName="pt-0"
      >
        <CredentialFields
          mode="test"
          label="Test keys"
          view={view.test}
          form={testForm}
          onChange={setTestForm}
          isSaving={isSaving}
          onClearSecret={() => handleClearSecret("test")}
          onClearWebhook={() => handleClearWebhook("test")}
        />
      </AdminSection>

      <div className="flex flex-wrap items-center gap-3 px-1">
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

      <p className="px-1 text-xs leading-5 text-muted-foreground">
        Environment variables in <code className="rounded bg-muted px-1 py-0.5">.env.local</code> still work as
        fallback when a field is not saved here. Admin settings take precedence. Use{" "}
        <code className="rounded bg-muted px-1 py-0.5">STRIPE_SECRET_KEY</code> /{" "}
        <code className="rounded bg-muted px-1 py-0.5">STRIPE_TEST_SECRET_KEY</code> for live and test respectively.
      </p>
    </form>
  )
}
