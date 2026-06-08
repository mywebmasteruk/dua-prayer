"use client"

import Link from "next/link"
import { HandCoins, ShieldAlert, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthButton } from "./auth/auth-button"
import { ActionIconTooltip } from "./action-icon-tooltip"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface HeaderActionsProps {
  user: SupabaseUser | null
  isAdmin?: boolean
}

export function HeaderActions({ user, isAdmin = false }: HeaderActionsProps) {
  return (
    <div className="flex items-center gap-1.5">
      {isAdmin ? (
        <ActionIconTooltip label="Admin">
          <Link href="/admin">
            <Button variant="ghost" size="icon" aria-label="Admin" className="rounded-full">
              <ShieldAlert className="h-5 w-5" />
            </Button>
          </Link>
        </ActionIconTooltip>
      ) : (
        <ActionIconTooltip label={user ? "Account" : "Sign in"}>
          <Link href="/auth">
            <Button
              variant="ghost"
              size="icon"
              aria-label={user ? "Account" : "Sign in"}
              className="rounded-full"
            >
              <User className="h-5 w-5" />
            </Button>
          </Link>
        </ActionIconTooltip>
      )}
      {user && <AuthButton user={user} />}
      <ActionIconTooltip label="Donate">
        <Link
          href="/donate"
          className="tap-feedback inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary shadow-sm hover:border-primary/35 hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Donate"
        >
          <HandCoins className="h-4 w-4" aria-hidden="true" />
        </Link>
      </ActionIconTooltip>
    </div>
  )
}
