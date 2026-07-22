"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type AdminBulkAction = {
  label: string
  onClick: () => void
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost"
  disabled?: boolean
}

type AdminBulkActionsBarProps = {
  selectedCount: number
  onClear: () => void
  actions: AdminBulkAction[]
  className?: string
}

export function AdminBulkActionsBar({ selectedCount, onClear, actions, className }: AdminBulkActionsBarProps) {
  if (selectedCount === 0) return null

  return (
    <div
      className={cn(
        "sticky top-0 z-10 mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/[0.06] px-3 py-2.5 text-sm shadow-sm transition-all duration-200 animate-in fade-in slide-in-from-top-1",
        className,
      )}
      role="region"
      aria-label="Bulk actions"
      aria-live="polite"
    >
      <span className="font-medium text-foreground">
        {selectedCount} selected
      </span>
      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground" onClick={onClear}>
        Clear
      </Button>
      <div className="ml-auto flex flex-wrap gap-1.5">
        {actions.map((action) => (
          <Button
            key={action.label}
            type="button"
            variant={action.variant ?? "outline"}
            size="sm"
            className="h-7"
            disabled={action.disabled}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
