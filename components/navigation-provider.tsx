"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { isSameOriginNavigationClick, shouldStartNavigation } from "@/lib/navigation"

interface NavigationContextValue {
  isNavigating: boolean
  startNavigation: () => void
}

const NavigationContext = createContext<NavigationContextValue | null>(null)

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider")
  }
  return context
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isNavigating, setIsNavigating] = useState(false)
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const routeKey = `${pathname}?${searchParams.toString()}`
  const routeKeyRef = useRef(routeKey)

  const clearCompleteTimer = useCallback(() => {
    if (completeTimerRef.current) {
      clearTimeout(completeTimerRef.current)
      completeTimerRef.current = null
    }
  }, [])

  const startNavigation = useCallback(() => {
    clearCompleteTimer()
    setIsNavigating(true)
  }, [clearCompleteTimer])

  const completeNavigation = useCallback(() => {
    clearCompleteTimer()
    completeTimerRef.current = setTimeout(() => {
      setIsNavigating(false)
    }, 120)
  }, [clearCompleteTimer])

  useEffect(() => {
    if (routeKeyRef.current === routeKey) return
    routeKeyRef.current = routeKey
    if (isNavigating) completeNavigation()
  }, [routeKey, isNavigating, completeNavigation])

  useEffect(() => {
    if (!isNavigating) return
    const fallback = setTimeout(completeNavigation, 12000)
    return () => clearTimeout(fallback)
  }, [completeNavigation, isNavigating])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest("a")
      if (!(anchor instanceof HTMLAnchorElement)) return
      if (!isSameOriginNavigationClick(event, anchor)) return
      if (!shouldStartNavigation(anchor.href)) return

      anchor.setAttribute("aria-busy", "true")
      window.setTimeout(() => anchor.removeAttribute("aria-busy"), 1200)
      startNavigation()
    }

    document.addEventListener("click", handleClick, true)
    return () => document.removeEventListener("click", handleClick, true)
  }, [startNavigation])

  useEffect(
    () => () => {
      clearCompleteTimer()
    },
    [clearCompleteTimer],
  )

  return (
    <NavigationContext.Provider value={{ isNavigating, startNavigation }}>
      {children}
    </NavigationContext.Provider>
  )
}
