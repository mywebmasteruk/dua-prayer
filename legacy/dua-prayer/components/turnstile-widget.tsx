"use client"

import Script from "next/script"
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string
          callback: (token: string) => void
          "expired-callback"?: () => void
          "error-callback"?: () => void
        },
      ) => string
      reset: (id: string) => void
      remove: (id: string) => void
    }
    onTurnstileLoad?: () => void
  }
}

// Multiple widgets can mount before the Turnstile script loads; the script
// calls a single global onload, so queue every pending render behind it.
const pendingRenders: Array<() => void> = []

function whenTurnstileReady(render: () => void) {
  if (typeof window === "undefined") return
  if (window.turnstile) {
    render()
    return
  }
  pendingRenders.push(render)
  window.onTurnstileLoad = () => {
    while (pendingRenders.length > 0) pendingRenders.shift()?.()
  }
}

export interface TurnstileWidgetHandle {
  /** Re-issue a challenge (tokens are single-use and expire after ~5 minutes). */
  reset: () => void
}

interface TurnstileWidgetProps {
  siteKey: string
  onVerify: (token: string) => void
  /** Called when the current token expires or errors; clear your stored token here. */
  onExpire?: () => void
}

export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ siteKey, onVerify, onExpire }, handle) {
    const ref = useRef<HTMLDivElement>(null)
    const widgetId = useRef<string | null>(null)

    useImperativeHandle(handle, () => ({
      reset: () => {
        if (widgetId.current && window.turnstile) {
          window.turnstile.reset(widgetId.current)
        }
      },
    }))

    useEffect(() => {
      whenTurnstileReady(() => {
        if (!ref.current || !window.turnstile || widgetId.current) return
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          callback: onVerify,
          "expired-callback": () => onExpire?.(),
          "error-callback": () => onExpire?.(),
        })
      })

      return () => {
        if (widgetId.current && window.turnstile) {
          window.turnstile.remove(widgetId.current)
          widgetId.current = null
        }
      }
    }, [siteKey, onVerify, onExpire])

    return (
      <>
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad" async defer />
        <div ref={ref} className="min-h-[65px]" />
      </>
    )
  },
)
