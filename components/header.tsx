import { BrandLogo } from "./brand-logo"
import { HeaderActions } from "./header-actions"
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
        <HeaderActions user={user} isAdmin={isAdmin} />
      </div>
    </header>
  )
}
