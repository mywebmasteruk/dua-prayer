import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type AdminToolbarProps = {
  children: ReactNode
  count?: ReactNode
  className?: string
}

export function AdminToolbar({ children, count, className }: AdminToolbarProps) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center",
        className,
      )}
      role="toolbar"
      aria-label="Table filters"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">{children}</div>
      {count ? (
        <div className="shrink-0 text-xs font-medium text-muted-foreground sm:ml-auto">{count}</div>
      ) : null}
    </div>
  )
}
