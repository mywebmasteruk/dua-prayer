"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { countNewDuasSince } from "@/app/actions/duas"

const DEFAULT_POLL_INTERVAL_MS = 45_000

export function useNewDuasPoll({
  enabled,
  sinceId,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
}: {
  enabled: boolean
  sinceId: number
  pollIntervalMs?: number
}) {
  const [count, setCount] = useState(0)
  const sinceIdRef = useRef(sinceId)

  useEffect(() => {
    sinceIdRef.current = sinceId
    setCount(0)
  }, [sinceId])

  useEffect(() => {
    if (!enabled) {
      setCount(0)
      return
    }

    let cancelled = false

    const runCheck = async () => {
      if (cancelled || document.hidden) return
      const newCount = await countNewDuasSince(sinceIdRef.current)
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
