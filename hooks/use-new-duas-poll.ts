"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { countNewDuasSince } from "@/app/actions/duas"

const DEFAULT_POLL_INTERVAL_MS = 45_000

export function useNewDuasPoll({
  enabled,
  sinceCreatedAt,
  languages,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
}: {
  enabled: boolean
  sinceCreatedAt: string | null
  /** Mirror the feed's language preference so counts match what's shown. */
  languages?: string[]
  pollIntervalMs?: number
}) {
  const [count, setCount] = useState(0)
  const sinceCreatedAtRef = useRef(sinceCreatedAt)
  const languagesRef = useRef(languages)

  // Serialize so a new array identity each render doesn't churn the effect.
  const languagesKey = (languages ?? []).join(",")

  useEffect(() => {
    sinceCreatedAtRef.current = sinceCreatedAt
    setCount(0)
  }, [sinceCreatedAt])

  useEffect(() => {
    languagesRef.current = languages
    setCount(0)
  }, [languagesKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!enabled) {
      setCount(0)
      return
    }

    let cancelled = false

    const runCheck = async () => {
      if (cancelled || document.hidden) return
      const newCount = await countNewDuasSince(sinceCreatedAtRef.current, languagesRef.current)
      if (!cancelled) setCount(newCount)
    }

    runCheck()
    const timer = window.setInterval(runCheck, pollIntervalMs)

    const onVisibilityChange = () => {
      if (!document.hidden) runCheck()
    }

    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      cancelled = true
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [enabled, pollIntervalMs])

  const dismiss = useCallback(() => setCount(0), [])

  return { count, dismiss }
}
