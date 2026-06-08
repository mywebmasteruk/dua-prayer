"use client"

import Script from "next/script"
import { useEffect, useRef } from "react"

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void }) => string
      remove: (id: string) => void
    }
    onTurnstileLoad?: () => void
  }
}

interface TurnstileWidgetProps {
  siteKey: string
  onVerify: (token: string) => void
}

export function TurnstileWidget({ siteKey, onVerify }: TurnstileWidgetProps) {
  const ref = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)

  useEffect(() => {
    const render = () => {
      if (!ref.current || !window.turnstile || widgetId.current) return
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        callback: onVerify,
      })
    }

    window.onTurnstileLoad = render
    render()

    return () => {
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current)
        widgetId.current = null
      }
    }
  }, [siteKey, onVerify])

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad" async defer />
      <div ref={ref} className="min-h-[65px]" />
    </>
  )
}
