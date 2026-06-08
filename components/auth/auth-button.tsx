"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { useNavigationRouter } from "@/hooks/use-navigation-router"
import type { User } from "@supabase/supabase-js"
import { LogOut } from "lucide-react"

interface AuthButtonProps {
  user: User | null
}

export function AuthButton({ user }: AuthButtonProps) {
  const router = useNavigationRouter()
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientSupabaseClient()

  const handleSignOut = async () => {
    setIsLoading(true)
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
    setIsLoading(false)
  }

  if (user) {
    return (
      <Button variant="ghost" onClick={handleSignOut} disabled={isLoading} size="sm">
        <LogOut className="mr-2 h-4 w-4" />
        {isLoading ? "Signing out..." : "Logout"}
      </Button>
    )
  }

  return null
}
