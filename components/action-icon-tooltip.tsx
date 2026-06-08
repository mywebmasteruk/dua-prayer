"use client"

import type { ReactElement } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface ActionIconTooltipProps {
  label: string
  children: ReactElement
  side?: "top" | "right" | "bottom" | "left"
  /** Wrap trigger so tooltips work on disabled controls */
  disabled?: boolean
}

export function ActionIconTooltip({
  label,
  children,
  side = "top",
  disabled = false,
}: ActionIconTooltipProps) {
  const trigger = disabled ? <span className="inline-flex">{children}</span> : children

  return (
    <Tooltip>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  )
}
