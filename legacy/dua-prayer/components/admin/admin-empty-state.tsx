import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type AdminEmptyStateProps = {
  title?: string
  description?: string
  action?: ReactNode
  className?: string
}

export function AdminEmptyState({
  title = "Nothing here yet",
  description,
  action,
  className,
}: AdminEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/15 px-6 py-12 text-center",
        className,
      )}
    >
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
