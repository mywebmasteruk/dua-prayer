"use client"

import { HeaderActions } from "./header-actions"
import { HomeSearchInput } from "./home-search-input"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface HomeSidebarToolbarProps {
  user: SupabaseUser | null
  isAdmin?: boolean
}

/** Search + account actions for the homepage right column (desktop). */
export function HomeSidebarToolbar({ user, isAdmin = false }: HomeSidebarToolbarProps) {
  return (
    <div className="hidden space-y-3 pb-2 lg:block">
      <HomeSearchInput />
      <div className="flex items-center justify-end">
        <HeaderActions user={user} isAdmin={isAdmin} />
      </div>
    </div>
  )
}
