"use client"

import type React from "react"
import { TooltipProvider } from "@/components/ui/tooltip"

export function AppTooltipProvider({ children }: { children: React.ReactNode }) {
  return <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
}
