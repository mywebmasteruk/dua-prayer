"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { useNavigationRouter } from "@/hooks/use-navigation-router"
import { cn } from "@/lib/utils"
import type { User } from "@supabase/supabase-js"
import { LogOut } from "lucide-react"

interface AuthButtonProps {
  user: User | null
  variant?: "default" | "cta"
}

export function AuthButton({ user, variant = "default" }: AuthButtonProps) {
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
    const isCta = variant === "cta"

    return (
      <Button
        variant="ghost"
        onClick={handleSignOut}
        disabled={isLoading}
        size={isCta ? "default" : "sm"}
        className={cn(
          isCta &&
            "h-auto w-full max-w-full justify-center gap-2 rounded-full bg-primary px-3 py-2.5 text-[14px] font-bold text-primary-foreground -translate-x-1 hover:bg-primary/90 hover:text-primary-foreground lg:px-4 lg:py-3 lg:text-[15px]",
        )}
      >
        <LogOut
          className={cn(isCta ? "h-[24px] w-[24px] shrink-0" : "mr-2 h-4 w-4")}
          aria-hidden="true"
        />
        {isLoading ? "Signing out..." : "Logout"}
      </Button>
    )
  }

  return null
}
