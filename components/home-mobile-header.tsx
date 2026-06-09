"use client"

import Link from "next/link"
import { HandCoins, ShieldAlert, User } from "lucide-react"
import { BrandLogo } from "./brand-logo"
import { HomeSearchInput } from "./home-search-input"
import { ActionIconTooltip } from "./action-icon-tooltip"
import { Button } from "./ui/button"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface HomeMobileHeaderProps {
  user: SupabaseUser | null
  isAdmin?: boolean
}

/** Inline mobile nav row — not a sticky top header bar. */
export function HomeMobileHeader({ user, isAdmin = false }: HomeMobileHeaderProps) {
  return (
    <div className="col-span-full flex items-center gap-2.5 pb-1 lg:hidden">
      <BrandLogo variant="icon" href="/" priority className="h-8 w-8 shrink-0" />
      <HomeSearchInput className="min-w-0 flex-1" />
      <div className="flex shrink-0 items-center gap-0.5">
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
    </div>
  )
}
