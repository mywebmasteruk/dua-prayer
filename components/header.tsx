import Link from "next/link"
import { HandCoins, ShieldAlert, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthButton } from "./auth/auth-button"
import { BrandLogo } from "./brand-logo"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface HeaderProps {
  user: SupabaseUser | null
  isAdmin?: boolean
}

export function Header({ user, isAdmin = false }: HeaderProps) {
  return (
    <header className="site-shell-header">
      <div className="site-container flex h-16 items-center justify-between gap-4">
        <BrandLogo variant="icon" href="/" showWordmark priority className="h-9 w-9 shrink-0" />
        <div className="flex items-center gap-1.5">
          {isAdmin ? (
            <Link href="/admin">
              <Button variant="ghost" size="icon" title="Admin dashboard" className="rounded-full">
                <ShieldAlert className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Link href="/auth">
              <Button variant="ghost" size="icon" title={user ? "Account" : "Sign in"} className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          )}
          {user && <AuthButton user={user} />}
          <Link
            href="/donate"
            className="tap-feedback inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary shadow-sm hover:border-primary/35 hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Donate"
            title="Donate"
          >
            <HandCoins className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  )
}
