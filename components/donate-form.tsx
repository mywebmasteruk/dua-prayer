"use client"

import { useState } from "react"
import { HandCoins, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DONATION_AMOUNTS_USD } from "@/lib/stripe"
import { useToast } from "@/hooks/use-toast"

interface DonateFormProps {
  stripeConfigured: boolean
}

export function DonateForm({ stripeConfigured }: DonateFormProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(25)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  async function handleDonate() {
    if (!stripeConfigured) {
      toast({
        title: "Donations unavailable",
        description:
          "Stripe is not configured yet. Set STRIPE_SECRET_KEY in your environment to enable checkout.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: selectedAmount }),
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
      toast({
        title: "Could not start checkout",
        description: error instanceof Error ? error.message : "Please try again in a moment.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {!stripeConfigured ? (
        <div
          role="status"
          className="rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950"
        >
          Donations are not live in this environment yet. Add{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs">STRIPE_SECRET_KEY</code> on the server and{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> for
          client-side Stripe features.
        </div>
      ) : null}

      <div>
        <p className="text-sm font-medium text-muted-foreground">Choose an amount (USD)</p>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {DONATION_AMOUNTS_USD.map((amount) => {
            const isSelected = selectedAmount === amount
            return (
              <button
                key={amount}
                type="button"
                onClick={() => setSelectedAmount(amount)}
                aria-pressed={isSelected}
                className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-[0_12px_28px_rgba(20,120,78,0.22)]"
                    : "border-border/70 bg-white/80 text-foreground hover:border-primary/30 hover:bg-primary/5"
                }`}
              >
                ${amount}
              </button>
            )
          })}
        </div>
      </div>

      <Button
        type="button"
        size="lg"
        className="h-12 w-full rounded-full text-base font-semibold"
        onClick={handleDonate}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Redirecting to Stripe…
          </>
        ) : (
          <>
            <HandCoins className="h-4 w-4" aria-hidden="true" />
            Donate ${selectedAmount}
          </>
        )}
      </Button>

      <p className="text-center text-xs leading-5 text-muted-foreground">
        Secure checkout powered by Stripe. You will be redirected to complete your donation.
      </p>
    </div>
  )
}
