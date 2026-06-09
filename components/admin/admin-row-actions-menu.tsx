"use client"

import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type AdminRowAction = {
  label: string
  onClick: () => void
  destructive?: boolean
  disabled?: boolean
  separatorBefore?: boolean
}

type AdminRowActionsMenuProps = {
  actions: AdminRowAction[]
  disabled?: boolean
  label?: string
}

export function AdminRowActionsMenu({ actions, disabled, label = "Row actions" }: AdminRowActionsMenuProps) {
  const visibleActions = actions.filter((action) => !action.disabled)

  if (visibleActions.length === 0) {
    return <span className="inline-block h-8 w-8" aria-hidden="true" />
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          disabled={disabled}
          aria-label={label}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {visibleActions.map((action, index) => (
          <div key={`${action.label}-${index}`}>
            {action.separatorBefore && index > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem
              disabled={action.disabled}
              className={action.destructive ? "text-destructive focus:text-destructive" : undefined}
              onSelect={() => action.onClick()}
            >
              {action.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
