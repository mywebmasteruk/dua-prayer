"use client"

import Link from "next/link"
import { MoreHorizontal, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { useNavigationRouter } from "@/hooks/use-navigation-router"

type AccountDockProps = {
  label: string
  email?: string | null
}

function initialsFor(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return "U"
  const parts = trimmed.includes("@") ? [trimmed.split("@")[0]] : trimmed.split(/\s+/)
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export function AccountDock({ label, email }: AccountDockProps) {
  const router = useNavigationRouter()
  const supabase = createClientSupabaseClient()
  const secondary = email && email !== label ? email : email ? `@${email.split("@")[0]}` : "Account settings"

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <div className="group flex items-center gap-2 rounded-full p-2 transition hover:bg-white/70 focus-within:bg-white/70">
      <Link
        href="/account"
        className="flex min-w-0 flex-1 items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Open account settings"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {initialsFor(label || email || "User")}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold leading-tight text-foreground" title={label}>
            {label}
          </span>
          <span className="mt-0.5 block truncate text-sm leading-tight text-muted-foreground" title={secondary}>
            {secondary}
          </span>
        </span>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full text-foreground hover:bg-white"
            aria-label="Open account menu"
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-56 rounded-2xl p-2">
          <DropdownMenuItem asChild className="rounded-xl font-medium">
            <Link href="/account">Account settings</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleSignOut} className="rounded-xl text-destructive focus:text-destructive">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
