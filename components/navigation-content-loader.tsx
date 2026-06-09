"use client"

import type { ReactNode } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNavigation } from "@/components/navigation-provider"

type NavigationContentLoaderProps = {
  children: ReactNode
  className?: string
}

/** Center spinner overlay for the main content slot — frame (sidebars, nav) stays static. */
export function NavigationContentLoader({ children, className }: NavigationContentLoaderProps) {
  const { isNavigating } = useNavigation()

  return (
    <div
      className={cn("relative min-h-[40vh]", className)}
      aria-busy={isNavigating}
      aria-live="polite"
    >
      {isNavigating ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />
          <span className="sr-only">Loading page content</span>
        </div>
      ) : null}
      <div className={cn(isNavigating && "pointer-events-none invisible")}>{children}</div>
    </div>
  )
}
