"use client"

import { Loader2 } from "lucide-react"
import { useNavigation } from "@/components/navigation-provider"
import { cn } from "@/lib/utils"

interface NavigationContentSpinnerProps {
  className?: string
}

export function NavigationContentSpinner({ className }: NavigationContentSpinnerProps) {
  const { isNavigating } = useNavigation()

  if (!isNavigating) return null

  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex min-h-[280px] items-center justify-center bg-background/70 backdrop-blur-[1px]",
        className,
      )}
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      <span className="sr-only">Loading page…</span>
    </div>
  )
}
