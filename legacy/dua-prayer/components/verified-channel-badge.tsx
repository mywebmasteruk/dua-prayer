import { ShieldCheck } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type VerifiedChannelBadgeProps = {
  className?: string
}

export function VerifiedChannelBadge({ className }: VerifiedChannelBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex shrink-0 items-center text-primary",
            className,
          )}
          aria-label="Verified channel"
        >
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        </span>
      </TooltipTrigger>
      <TooltipContent>Verified channel</TooltipContent>
    </Tooltip>
  )
}
