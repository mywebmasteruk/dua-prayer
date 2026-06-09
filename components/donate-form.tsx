"use client"

import { useState } from "react"
import { HandCoins, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DONATION_AMOUNTS_USD } from "@/lib/stripe"
import { useToast } from "@/hooks/use-toast"

interface DonateFormProps {
  donationsReady: boolean
  showSetupWarning: boolean
}

export function DonateForm({ donationsReady, showSetupWarning }: DonateFormProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(25)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  async function handleDonate() {
    if (!donationsReady) {
      toast({
        title: "Donations unavailable",
        description: showSetupWarning
          ? "Add STRIPE_SECRET_KEY, STRIPE_PRICE_DONATION_* price IDs, and NEXT_PUBLIC_APP_URL to server env."
          : "Donations are temporarily unavailable. Please try again later.",
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
      {showSetupWarning ? (
        <p
          role="status"
          className="rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950"
        >
          Checkout not enabled here — set{" "}
          <code className="rounded bg-amber-100 px-1 py-0.5">STRIPE_SECRET_KEY</code> plus donation price IDs and{" "}
          <code className="rounded bg-amber-100 px-1 py-0.5">NEXT_PUBLIC_APP_URL</code> in server env.
        </p>
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
