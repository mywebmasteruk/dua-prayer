import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type AdminTableShellProps = {
  children: ReactNode
  className?: string
}

export function AdminTableShell({ children, className }: AdminTableShellProps) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-lg border border-border/60 bg-background [-webkit-overflow-scrolling:touch]",
        className,
      )}
    >
      <div className="min-w-full [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-[1] [&_thead]:bg-muted/80 [&_thead]:backdrop-blur-sm [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-muted/30">
        {children}
      </div>
    </div>
  )
}
