import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type AdminSectionProps = {
  title?: string
  description?: ReactNode
  action?: ReactNode
  children?: ReactNode
  className?: string
  contentClassName?: string
  variant?: "default" | "plain"
}

export function AdminSection({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
  variant = "default",
}: AdminSectionProps) {
  return (
    <section
      className={cn(
        variant === "default" && "rounded-xl border border-border/60 bg-background",
        variant === "plain" && "border-t border-border/60 pt-6 first:border-t-0 first:pt-0",
        className,
      )}
    >
      {title || description || action ? (
        <div
          className={cn(
            "flex flex-wrap items-start justify-between gap-3",
            variant === "default"
              ? cn("px-5 py-4", children ? "border-b border-border/50" : "")
              : "mb-4",
          )}
        >
          <div className="min-w-0 space-y-1">
            {title ? <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2> : null}
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}

      {children ? (
        <div className={cn(variant === "default" ? "px-5 py-5" : "", contentClassName)}>{children}</div>
      ) : null}
    </section>
  )
}
