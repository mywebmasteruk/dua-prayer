"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createDua } from "@/app/actions/duas"
import { useNavigationRouter } from "@/hooks/use-navigation-router"
import type { Category } from "@/lib/types/dua"
import { toast } from "@/components/ui/use-toast"
import { TurnstileWidget, type TurnstileWidgetHandle } from "@/components/turnstile-widget"
import { cn } from "@/lib/utils"
import {
  detectLanguage,
  type LanguageMode,
  resolveFontClassName,
  resolveTextDirection,
} from "@/lib/detect-language"

interface DuaFormProps {
  categories: Category[]
  turnstileSiteKey?: string
  onSuccess?: () => void
}

export function DuaForm({ categories, turnstileSiteKey, onSuccess }: DuaFormProps) {
  const [duaText, setDuaText] = useState("")
  const [category, setCategory] = useState("")
  const [languageMode, setLanguageMode] = useState<LanguageMode>("auto")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [charCount, setCharCount] = useState(0)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileWidgetHandle>(null)
  const router = useNavigationRouter()

  const MAX_CHARS = 280
  const MIN_CHARS = 15
  const turnstileRequired = !!turnstileSiteKey

  useEffect(() => {
    const generalCategory = categories.find((cat) => cat.name === "General")
    if (generalCategory) setCategory(generalCategory.id.toString())
    else if (categories.length > 0) setCategory(categories[0].id.toString())
  }, [categories])

  useEffect(() => {
    setCharCount(duaText.length)
  }, [duaText])

  const onTurnstileVerify = useCallback((token: string) => setTurnstileToken(token), [])
  const onTurnstileExpire = useCallback(() => setTurnstileToken(null), [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (duaText.trim().length < MIN_CHARS) {
      toast({ title: "Error", description: `Please enter at least ${MIN_CHARS} characters`, variant: "destructive" })
      return
    }

    if (turnstileRequired && !turnstileToken) {
      toast({ title: "Error", description: "Please complete the verification check", variant: "destructive" })
      return
    }

    setIsSubmitting(true)

    const formData = new FormData()
    formData.append("text", duaText)
    if (category) formData.append("category_id", category)
    if (turnstileToken) formData.append("cf-turnstile-response", turnstileToken)
    formData.append("website", "")

    const result = await createDua(formData)

    // Tokens are single-use: re-issue a challenge whether the submit succeeded or not.
    setTurnstileToken(null)
    turnstileRef.current?.reset()

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else {
      setDuaText("")
      setLanguageMode("auto")
      toast({ title: "Success", description: "Your dua has been shared" })
      onSuccess?.()
      router.refresh()
    }

    setIsSubmitting(false)
  }

  const textDirection = resolveTextDirection(languageMode, duaText)
  const fontClassName = resolveFontClassName(languageMode, duaText)
  const detectedLanguage = detectLanguage(duaText)
  const languageTriggerLabel =
    languageMode === "auto"
      ? detectedLanguage === "ar"
        ? "Auto · العربية"
        : "Auto · English"
      : languageMode === "ar"
        ? "العربية"
        : "English"

  const handleTextChange = (value: string) => {
    if (value.length > MAX_CHARS) return
    if (value.length === 0) setLanguageMode("auto")
    setDuaText(value)
  }

  // HomeComposer modal uses z-[100]; portaled SelectContent must sit above it.
  const selectContentClassName = "z-[110]"

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="flex gap-3">
        <div className="shrink-0 pt-1">
          <Image
            src="/logo-icon.png"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded-full"
            aria-hidden="true"
          />
        </div>
        <div className="flex-1 min-w-0">
          <Textarea
            placeholder="Share a dua for yourself, your family, or someone who needs support..."
            dir={textDirection}
            className={cn(
              "min-h-[88px] resize-none border-0 bg-transparent px-0 text-[17px] leading-relaxed shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/80",
              textDirection === "rtl" && "text-right leading-8",
              fontClassName,
            )}
            value={duaText}
            onChange={(e) => handleTextChange(e.target.value)}
            maxLength={MAX_CHARS}
            aria-label="Dua text"
          />

          {turnstileSiteKey && (
            <div className="mt-3">
              <TurnstileWidget
                ref={turnstileRef}
                siteKey={turnstileSiteKey}
                onVerify={onTurnstileVerify}
                onExpire={onTurnstileExpire}
              />
            </div>
          )}

          <div className="mt-3 pt-3 border-t feed-divider flex items-center justify-between flex-wrap gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9 w-[160px] rounded-full border-primary/25 bg-muted/40 text-sm">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent position="popper" className={selectContentClassName}>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={languageMode}
                onValueChange={(value) => setLanguageMode(value as LanguageMode)}
              >
                <SelectTrigger
                  className="h-9 w-[148px] rounded-full border-primary/25 bg-muted/40 text-sm"
                  aria-label="Language"
                >
                  <span className="truncate">{languageTriggerLabel}</span>
                </SelectTrigger>
                <SelectContent position="popper" className={selectContentClassName}>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <div
                className={`text-xs tabular-nums ${
                  charCount < MIN_CHARS && charCount > 0 ? "text-destructive" : "text-muted-foreground"
                }`}
                aria-live="polite"
              >
                {charCount}/{MAX_CHARS}
              </div>
              <Button
                type="submit"
                className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90"
                disabled={isSubmitting || duaText.trim().length < MIN_CHARS || (turnstileRequired && !turnstileToken)}
                aria-label="Share Dua"
              >
                {isSubmitting ? "Sharing…" : "Share"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
