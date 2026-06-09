"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { countNewDuasSince } from "@/app/actions/duas"

const DEFAULT_POLL_INTERVAL_MS = 45_000

export function useNewDuasPoll({
  enabled,
  sinceCreatedAt,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
}: {
  enabled: boolean
  sinceCreatedAt: string | null
  pollIntervalMs?: number
}) {
  const [count, setCount] = useState(0)
  const sinceCreatedAtRef = useRef(sinceCreatedAt)

  useEffect(() => {
    sinceCreatedAtRef.current = sinceCreatedAt
    setCount(0)
  }, [sinceCreatedAt])

  useEffect(() => {
    if (!enabled) {
      setCount(0)
      return
    }

    let cancelled = false

    const runCheck = async () => {
      if (cancelled || document.hidden) return
      const newCount = await countNewDuasSince(sinceCreatedAtRef.current)
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
