"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { AuthForm } from "@/components/auth/auth-form"
import { useNavigationRouter } from "@/hooks/use-navigation-router"
import { buildHomeUrlWithoutSignIn, isSignInOpen } from "@/lib/auth-modal"

interface HomeAuthModalProps {
  error?: string
  resetSuccess?: boolean
  next?: string
  initiallyOpen?: boolean
}

export function HomeAuthModal({ error, resetSuccess, next, initiallyOpen = false }: HomeAuthModalProps) {
  const [open, setOpen] = useState(initiallyOpen)
  const searchParams = useSearchParams()
  const router = useNavigationRouter()

  useEffect(() => {
    setOpen(isSignInOpen(searchParams))
  }, [searchParams])

  const closeModal = useCallback(() => {
    setOpen(false)
    if (isSignInOpen(searchParams)) {
      router.replace(buildHomeUrlWithoutSignIn(searchParams), { scroll: false })
    }
  }, [router, searchParams])

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setOpen(true)
      return
    }
    closeModal()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md border-0 bg-transparent p-0 shadow-none sm:max-w-md [&>button]:z-10 [&>button]:rounded-full [&>button]:bg-background/90 [&>button]:shadow-sm">
        <AuthForm error={error} resetSuccess={resetSuccess} next={next} onMagicLinkSuccess={closeModal} />
      </DialogContent>
    </Dialog>
  )
}
