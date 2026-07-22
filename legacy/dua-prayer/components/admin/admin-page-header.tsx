import type { ReactNode } from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

type AdminPageHeaderProps = {
  title: string
  description?: ReactNode
  icon?: LucideIcon
  actions?: ReactNode
  backHref?: string
  backLabel?: string
  meta?: ReactNode
  className?: string
}

export function AdminPageHeader({
  title,
  description,
  icon: Icon,
  actions,
  backHref,
  backLabel = "Back to settings",
  meta,
  className,
}: AdminPageHeaderProps) {
  return (
    <header className={cn("mb-8 space-y-4", className)}>
      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
          {backLabel}
        </Link>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-2.5">
            {Icon ? (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
            ) : null}
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.625rem]">
              {title}
            </h1>
          </div>
          {description ? (
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
          {meta ? <div className="pt-0.5">{meta}</div> : null}
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
        ) : null}
      </div>
    </header>
  )
}
