"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createDua, searchHashtags } from "@/app/actions/duas"
import { useNavigationRouter } from "@/hooks/use-navigation-router"
import type { Category } from "@/lib/types/dua"
import { getComposerCategoryLabel, type ComposerCopy } from "@/lib/site-copy"
import { toast } from "@/components/ui/use-toast"
import { TurnstileWidget, type TurnstileWidgetHandle } from "@/components/turnstile-widget"
import { signInHref } from "@/lib/auth-modal"
import { shouldAllowPublicDuaSubmission, type PostingMode } from "@/lib/posting-settings-shared"
import { cn } from "@/lib/utils"
import {
  arabicFontClassName,
  detectLanguage,
  type LanguageMode,
  resolveFontClassName,
  resolveTextDirection,
} from "@/lib/detect-language"

// The hashtag the caret is currently inside ("#word"), if any — drives the
// "#" autocomplete like Instagram/X/Facebook.
function getActiveHashtag(text: string, caret: number): { start: number; query: string } | null {
  let start = caret
  while (start > 0 && !/\s/.test(text[start - 1])) start -= 1
  const token = text.slice(start, caret)
  if (!token.startsWith("#")) return null
  if (!/^#[\p{L}\p{N}_-]*$/u.test(token)) return null
  return { start, query: token.slice(1) }
}

// Render text with hashtags colored, for the overlay that sits under the
// (transparent-text) textarea — so #tags appear highlighted inline as you type.
function renderHighlightedText(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const pattern = /#[\p{L}\p{N}][\p{L}\p{N}_-]*/gu
  let lastIndex = 0
  let key = 0
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    const prev = match.index > 0 ? text[match.index - 1] : ""
    if (prev && !/\s/.test(prev)) continue // only treat "#" at a word boundary as a hashtag
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index))
    nodes.push(
      <span key={key++} className="font-semibold text-primary">
        {match[0]}
      </span>,
    )
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  // Preserve a trailing newline's line box so the overlay height matches the textarea.
  if (text.endsWith("\n")) nodes.push("​")
  return nodes
}

interface DuaFormProps {
  categories: Category[]
  turnstileSiteKey?: string
  copy: ComposerCopy
  onLanguageChange?: (languageMode: LanguageMode) => void
  onSuccess?: () => void
  postingMode: PostingMode
  isSignedIn: boolean
  isAdmin: boolean
}

export function DuaForm({
  categories,
  turnstileSiteKey,
  copy,
  onLanguageChange,
  onSuccess,
  postingMode,
  isSignedIn,
  isAdmin,
}: DuaFormProps) {
  const [duaText, setDuaText] = useState("")
  const [category, setCategory] = useState("")
  const [languageMode, setLanguageMode] = useState<LanguageMode>("auto")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [charCount, setCharCount] = useState(0)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileWidgetHandle>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const [hashtag, setHashtag] = useState<{ start: number; query: string } | null>(null)
  const [hashtagSuggestions, setHashtagSuggestions] = useState<string[]>([])
  const [activeSuggestion, setActiveSuggestion] = useState(0)
  const router = useNavigationRouter()

  const MAX_CHARS = 1200
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

    const postingAccess = shouldAllowPublicDuaSubmission({ mode: postingMode, isAuthenticated: isSignedIn, isAdmin })
    if (!postingAccess.allowed) {
      toast({ title: "Posting unavailable", description: postingAccess.error, variant: "destructive" })
      if (postingMode === "registered_only" && !isSignedIn) router.push(signInHref({ next: "/" }))
      return
    }

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
      handleLanguageChange("auto")
      toast({ title: "Success", description: "Your dua has been submitted" })
      onSuccess?.()
      router.refresh()
    }

    setIsSubmitting(false)
  }

  const textDirection = resolveTextDirection(languageMode, duaText)
  const uiDirection = languageMode === "ar" ? "rtl" : "ltr"
  const isArabicUi = languageMode === "ar"
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
  const placeholder = isArabicUi ? copy.composerPlaceholderAr : copy.composerPlaceholderEn
  const categoryPlaceholder = isArabicUi ? copy.composerCategoryPlaceholderAr : copy.composerCategoryPlaceholderEn
  const submitLabel = isArabicUi ? copy.composerSubmitAr : copy.composerSubmitEn
  const submitAriaLabel = isArabicUi ? copy.composerSubmitAriaAr : copy.composerSubmitAriaEn
  const submittingLabel = isArabicUi ? copy.composerSubmittingAr : copy.composerSubmittingEn

  const getCategoryLabel = (cat: Category) => getComposerCategoryLabel(cat.name, copy, languageMode)

  const handleLanguageChange = (value: LanguageMode) => {
    setLanguageMode(value)
    onLanguageChange?.(value)
  }

  // Track whether the caret sits inside a "#hashtag" (updated on input + caret moves).
  const syncHashtagContext = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    setHashtag(getActiveHashtag(el.value, el.selectionStart ?? el.value.length))
  }, [])

  const hashtagQuery = hashtag?.query ?? null

  useEffect(() => {
    if (hashtagQuery === null) {
      setHashtagSuggestions([])
      return
    }
    let active = true
    const timer = setTimeout(async () => {
      const results = await searchHashtags(hashtagQuery)
      if (active) {
        setHashtagSuggestions(results)
        setActiveSuggestion(0)
      }
    }, 150)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [hashtagQuery])

  const insertHashtag = (tag: string) => {
    const el = textareaRef.current
    if (!el || !hashtag) return
    const caret = el.selectionStart ?? duaText.length
    let end = caret
    while (end < duaText.length && /[\p{L}\p{N}_-]/u.test(duaText[end])) end += 1
    const insert = `#${tag} `
    const next = duaText.slice(0, hashtag.start) + insert + duaText.slice(end)
    if (next.length > MAX_CHARS) return
    setDuaText(next)
    setHashtag(null)
    setHashtagSuggestions([])
    const pos = hashtag.start + insert.length
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(pos, pos)
    })
  }

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!hashtag || hashtagSuggestions.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveSuggestion((i) => (i + 1) % hashtagSuggestions.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveSuggestion((i) => (i - 1 + hashtagSuggestions.length) % hashtagSuggestions.length)
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault()
      insertHashtag(hashtagSuggestions[activeSuggestion])
    } else if (e.key === "Escape") {
      setHashtag(null)
      setHashtagSuggestions([])
    }
  }

  const handleTextChange = (value: string) => {
    if (value.length > MAX_CHARS) return
    if (value.length === 0) handleLanguageChange("auto")
    setDuaText(value)
    syncHashtagContext()
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
        <div className="relative flex-1 min-w-0">
          {/* Overlay mirror: shows the same text with hashtags colored, under the
              transparent-text textarea so #tags highlight inline as you type. */}
          <div
            ref={highlightRef}
            aria-hidden="true"
            dir={isArabicUi ? "rtl" : textDirection}
            className={cn(
              "pointer-events-none absolute inset-0 min-h-[88px] overflow-hidden whitespace-pre-wrap break-words px-0 py-2 text-[17px] text-foreground",
              (isArabicUi || textDirection === "rtl") ? "text-right leading-8" : "leading-relaxed",
              fontClassName,
            )}
          >
            {renderHighlightedText(duaText)}
          </div>
          <Textarea
            ref={textareaRef}
            placeholder={placeholder}
            dir={isArabicUi ? "rtl" : textDirection}
            style={{ caretColor: "hsl(var(--foreground))" }}
            className={cn(
              "relative z-[1] min-h-[88px] resize-none border-0 bg-transparent px-0 py-2 text-[17px] leading-relaxed text-transparent shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/80",
              (isArabicUi || textDirection === "rtl") && "text-right leading-8",
              fontClassName,
            )}
            value={duaText}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            onSelect={syncHashtagContext}
            onScroll={(e) => {
              if (highlightRef.current) highlightRef.current.scrollTop = e.currentTarget.scrollTop
            }}
            onBlur={() => setTimeout(() => { setHashtag(null); setHashtagSuggestions([]) }, 120)}
            maxLength={MAX_CHARS}
            aria-label="Dua text"
          />

          {hashtag && hashtagSuggestions.length > 0 ? (
            <ul
              className="absolute left-0 right-0 z-[120] mt-1 max-h-56 overflow-auto rounded-xl border border-border bg-popover py-1 shadow-lg"
              role="listbox"
              aria-label="Hashtag suggestions"
            >
              {hashtagSuggestions.map((tag, index) => (
                <li key={tag}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === activeSuggestion}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      insertHashtag(tag)
                    }}
                    onMouseEnter={() => setActiveSuggestion(index)}
                    className={cn(
                      "flex w-full items-center px-3 py-2 text-left text-sm",
                      index === activeSuggestion ? "bg-muted" : "hover:bg-muted/60",
                    )}
                  >
                    <span className="font-semibold text-primary">#{tag}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

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
                <SelectTrigger
                  className={cn(
                    "h-9 w-[160px] rounded-full border-primary/25 bg-muted/40 text-sm",
                    isArabicUi && arabicFontClassName,
                  )}
                  dir={uiDirection}
                >
                  <SelectValue placeholder={categoryPlaceholder} />
                </SelectTrigger>
                <SelectContent position="popper" className={selectContentClassName}>
                  {categories.map((cat) => (
                    <SelectItem
                      key={cat.id}
                      value={cat.id.toString()}
                      dir={uiDirection}
                      className={isArabicUi ? arabicFontClassName : undefined}
                    >
                      {getCategoryLabel(cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={languageMode}
                onValueChange={(value) => handleLanguageChange(value as LanguageMode)}
              >
                <SelectTrigger
                  className={cn(
                    "h-9 w-[148px] rounded-full border-primary/25 bg-muted/40 text-sm",
                    isArabicUi && arabicFontClassName,
                  )}
                  aria-label="Language"
                >
                  <span className="truncate">{languageTriggerLabel}</span>
                </SelectTrigger>
                <SelectContent position="popper" className={selectContentClassName}>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar" className={arabicFontClassName}>
                    العربية
                  </SelectItem>
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
                className={cn(
                  "rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90",
                  isArabicUi && arabicFontClassName,
                )}
                disabled={isSubmitting || duaText.trim().length < MIN_CHARS || (turnstileRequired && !turnstileToken)}
                aria-label={submitAriaLabel}
                dir={uiDirection}
              >
                {isSubmitting ? submittingLabel : submitLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
