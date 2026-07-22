"use client"

import { Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function TrendingInfoTooltip() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex shrink-0 rounded-full text-muted-foreground/70 transition hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="About trending rankings"
        >
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[16rem] space-y-2 p-3 text-xs leading-5">
        <p>Ranked by recent requests and community ameen activity in the live feed.</p>
        <p>Counts are community signals, not advice or ranking by religious authority.</p>
      </TooltipContent>
    </Tooltip>
  )
}
