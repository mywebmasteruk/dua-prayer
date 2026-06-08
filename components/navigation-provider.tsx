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
import { cn } from "@/lib/utils"
import { isSameOriginNavigationClick } from "@/lib/navigation"

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
  const [progress, setProgress] = useState(0)
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const routeKey = `${pathname}?${searchParams.toString()}`
  const routeKeyRef = useRef(routeKey)

  const clearProgressTimer = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
  }, [])

  const clearCompleteTimer = useCallback(() => {
    if (completeTimerRef.current) {
      clearTimeout(completeTimerRef.current)
      completeTimerRef.current = null
    }
  }, [])

  const startNavigation = useCallback(() => {
    clearCompleteTimer()
    setIsNavigating(true)
    setProgress((value) => (value > 0 ? value : 18))
  }, [clearCompleteTimer])

  const completeNavigation = useCallback(() => {
    clearProgressTimer()
    setProgress(100)
    clearCompleteTimer()
    completeTimerRef.current = setTimeout(() => {
      setIsNavigating(false)
      setProgress(0)
    }, 220)
  }, [clearCompleteTimer, clearProgressTimer])

  useEffect(() => {
    if (!isNavigating) return

    clearProgressTimer()
    progressTimerRef.current = setInterval(() => {
      setProgress((value) => {
        if (value >= 92) return value
        return value + Math.random() * 8 + 2
      })
    }, 280)

    return clearProgressTimer
  }, [clearProgressTimer, isNavigating])

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

      anchor.setAttribute("aria-busy", "true")
      window.setTimeout(() => anchor.removeAttribute("aria-busy"), 1200)
      startNavigation()
    }

    document.addEventListener("click", handleClick, true)
    return () => document.removeEventListener("click", handleClick, true)
  }, [startNavigation])

  useEffect(() => {
    document.body.toggleAttribute("data-navigating", isNavigating)
    document.body.setAttribute("aria-busy", isNavigating ? "true" : "false")
    return () => {
      document.body.removeAttribute("data-navigating")
      document.body.setAttribute("aria-busy", "false")
    }
  }, [isNavigating])

  useEffect(
    () => () => {
      clearProgressTimer()
      clearCompleteTimer()
    },
    [clearCompleteTimer, clearProgressTimer],
  )

  return (
    <NavigationContext.Provider value={{ isNavigating, startNavigation }}>
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] overflow-hidden transition-opacity duration-200",
          isNavigating || progress > 0 ? "opacity-100" : "opacity-0",
        )}
      >
        <div
          className="h-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.45)] transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {children}
    </NavigationContext.Provider>
  )
}
