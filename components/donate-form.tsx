"use client"

import Link from "next/link"
import { useCallback, useRef, useState } from "react"
import { Building2, HandCoins, Loader2, Server, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DONATION_PACKAGES,
  MAX_DONATION_USD,
  MIN_DONATION_USD,
  type DonationPackageId,
  type DonationType,
  type DonationsUnavailableReason,
} from "@/lib/stripe"
import { useToast } from "@/components/ui/use-toast"
import { TurnstileWidget, type TurnstileWidgetHandle } from "@/components/turnstile-widget"
import { cn } from "@/lib/utils"

const PACKAGE_ICONS = {
  hosting: Server,
  development: Sparkles,
  operations: Building2,
} as const

interface DonateFormProps {
  donationsReady: boolean
  unavailableReason?: DonationsUnavailableReason
  turnstileSiteKey?: string
}

export function DonateForm({ donationsReady, unavailableReason, turnstileSiteKey }: DonateFormProps) {
  const defaultPackage = DONATION_PACKAGES[0]
  const [selectedPackageId, setSelectedPackageId] = useState<DonationPackageId>(defaultPackage.id)
  const [donationType, setDonationType] = useState<DonationType>("monthly")
  const [amountInput, setAmountInput] = useState(String(defaultPackage.suggestedAmountUsd))
  const [isLoading, setIsLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileWidgetHandle>(null)
  const turnstileRequired = !!turnstileSiteKey
  const { toast } = useToast()

  const onTurnstileVerify = useCallback((token: string) => setTurnstileToken(token), [])
  const onTurnstileExpire = useCallback(() => setTurnstileToken(null), [])

  const parsedAmount = Number.parseInt(amountInput, 10)
  const amountIsValid =
    Number.isFinite(parsedAmount) &&
    Number.isInteger(parsedAmount) &&
    parsedAmount >= MIN_DONATION_USD &&
    parsedAmount <= MAX_DONATION_USD

  function selectPackage(packageId: DonationPackageId) {
    const pkg = DONATION_PACKAGES.find((entry) => entry.id === packageId)
    if (!pkg) return
    setSelectedPackageId(packageId)
    setAmountInput(String(pkg.suggestedAmountUsd))
  }

  function handleAmountChange(value: string) {
    const digitsOnly = value.replace(/[^\d]/g, "")
    setAmountInput(digitsOnly)
  }

  async function handleDonate() {
    if (!donationsReady) {
      toast({
        title: "Donations unavailable",
        description: getUnavailableDescription(unavailableReason),
        variant: "destructive",
      })
      return
    }

    if (!amountIsValid) {
      toast({
        title: "Check your amount",
        description: `Enter a whole-dollar amount between $${MIN_DONATION_USD} and $${MAX_DONATION_USD.toLocaleString()}.`,
        variant: "destructive",
      })
      return
    }

    if (turnstileRequired && !turnstileToken) {
      toast({
        title: "Almost there",
        description: "Please complete the verification check below first.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          packageId: selectedPackageId,
          donationType,
          turnstileToken,
        }),
      })

      const data = (await response.json()) as { url?: string; error?: string }

      if (!response.ok) {
        throw new Error(data.error ?? "Checkout failed")
      }

      if (!data.url) {
        throw new Error("No checkout URL returned")
      }

      window.location.href = data.url
    } catch (error) {
      // Tokens are single-use; re-issue a challenge before the next attempt.
      setTurnstileToken(null)
      turnstileRef.current?.reset()
      toast({
        title: "Could not start checkout",
        description: error instanceof Error ? error.message : "Please try again in a moment.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const donateLabel = amountIsValid
    ? donationType === "monthly"
      ? `Give $${parsedAmount}/month`
      : `Donate $${parsedAmount}`
    : "Enter an amount"

  return (
    <div className="space-y-6">
      {!donationsReady ? (
        <div
          role="status"
          className="rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-950"
        >
          <p className="font-semibold">Online donations are not configured yet</p>
          <p className="mt-1">{getUnavailableDescription(unavailableReason)}</p>
          {unavailableReason === "stripe_key" ? (
            <p className="mt-2 text-xs leading-5 text-amber-900/80">
              A super admin can add keys under{" "}
              <Link href="/admin/settings/stripe" className="font-medium underline underline-offset-2">
                Admin → Settings → Stripe
              </Link>
              {process.env.NODE_ENV === "development" ? (
                <>
                  , or set <code className="rounded bg-amber-100 px-1 py-0.5">STRIPE_SECRET_KEY</code> in{" "}
                  <code className="rounded bg-amber-100 px-1 py-0.5">.env.local</code>
                </>
              ) : null}
              . Never commit secrets.
            </p>
          ) : null}
        </div>
      ) : null}

      <div>
        <p className="text-sm font-medium text-foreground">Choose where your gift helps most</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Pick an impact area, then adjust the amount to whatever feels right for you.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {DONATION_PACKAGES.map((pkg) => {
            const Icon = PACKAGE_ICONS[pkg.id]
            const isSelected = selectedPackageId === pkg.id

            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => selectPackage(pkg.id)}
                aria-pressed={isSelected}
                className={cn(
                  "group rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-[0_12px_28px_rgba(20,120,78,0.14)]"
                    : "border-border/70 bg-white hover:border-primary/30 hover:bg-primary/[0.03]",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-10 w-10 items-center justify-center rounded-xl transition",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
                  )}
                  aria-hidden="true"
                >
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-semibold tracking-tight text-foreground">{pkg.title}</p>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{pkg.description}</p>
                <p className="mt-3 text-xs font-medium text-primary">
                  Suggested ${pkg.suggestedAmountUsd}
                  {donationType === "monthly" ? "/month" : ""}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-white p-4 sm:p-5">
        <label htmlFor="donation-amount" className="text-sm font-medium text-foreground">
          Your donation amount (USD)
        </label>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Any whole-dollar amount works — the suggestion above is just a starting point.
          {donationType === "monthly" ? " Billed monthly until you cancel in Stripe." : ""}
        </p>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative w-[9.5rem] shrink-0">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                $
              </span>
              <Input
                id="donation-amount"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={amountInput}
                onChange={(event) => handleAmountChange(event.target.value)}
                disabled={isLoading}
                aria-invalid={!amountIsValid && amountInput.length > 0}
                className="h-11 rounded-xl pl-7 text-base font-semibold"
                placeholder={String(defaultPackage.suggestedAmountUsd)}
              />
            </div>

            <div
              className="inline-flex shrink-0 rounded-full border border-border/70 bg-muted/30 p-0.5"
              role="group"
              aria-label="Donation frequency"
            >
              {(
                [
                  { value: "monthly", label: "Monthly" },
                  { value: "once", label: "One time" },
                ] as const
              ).map((option) => {
                const isSelected = donationType === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDonationType(option.value)}
                    aria-pressed={isSelected}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          {donationsReady ? (
            <Button
              type="button"
              className="h-11 w-full shrink-0 rounded-full px-5 text-sm font-semibold sm:ml-auto sm:w-auto sm:min-w-[10.5rem]"
              onClick={handleDonate}
              disabled={isLoading || !amountIsValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Redirecting to Stripe…
                </>
              ) : (
                <>
                  <HandCoins className="h-4 w-4" aria-hidden="true" />
                  {donateLabel}
                </>
              )}
            </Button>
          ) : null}
        </div>

        {!amountIsValid && amountInput.length > 0 ? (
          <p className="mt-2 text-xs text-destructive">
            Enter a whole-dollar amount between ${MIN_DONATION_USD} and ${MAX_DONATION_USD.toLocaleString()}.
          </p>
        ) : null}

        {donationsReady && turnstileSiteKey ? (
          <div className="mt-4">
            <TurnstileWidget
              ref={turnstileRef}
              siteKey={turnstileSiteKey}
              onVerify={onTurnstileVerify}
              onExpire={onTurnstileExpire}
            />
          </div>
        ) : null}
      </div>

      <p className="text-center text-xs leading-5 text-muted-foreground">
        Secure checkout powered by Stripe. You will be redirected to complete your donation.
      </p>
    </div>
  )
}

function getUnavailableDescription(reason?: DonationsUnavailableReason): string {
  if (reason === "stripe_key") {
    return "Stripe is not connected on this environment yet, so checkout cannot start."
  }

  if (reason === "app_url") {
    return "Set NEXT_PUBLIC_APP_URL in your environment so Stripe can return to the donate page after checkout."
  }

  return "Online giving is temporarily unavailable. Please try again later."
}
