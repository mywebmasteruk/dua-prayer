"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Plus, X } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"
import { DuaForm } from "@/components/dua-form"
import { ActionIconTooltip } from "@/components/action-icon-tooltip"
import type { Category } from "@/lib/types/dua"
import type { ComposerCopy } from "@/lib/site-copy"
import type { LanguageMode } from "@/lib/detect-language"

interface HomeComposerProps {
  categories: Category[]
  turnstileSiteKey?: string
  copy: ComposerCopy
}

export function HomeComposer({ categories, turnstileSiteKey, copy }: HomeComposerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [composerLanguage, setComposerLanguage] = useState<LanguageMode>("auto")
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = "home-composer-title"
  const isArabicComposer = composerLanguage === "ar"
  const modalTitle = isArabicComposer ? copy.composerTitleAr : copy.composerTitleEn
  const modalDescription = isArabicComposer ? copy.composerDescriptionAr : copy.composerDescriptionEn

  useEffect(() => {
    if (!isOpen) setComposerLanguage("auto")
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const focusTarget = window.setTimeout(() => {
      dialogRef.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus()
    }, 0)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.clearTimeout(focusTarget)
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  return (
    <>
      <div
        className="group flex w-full cursor-pointer items-center gap-3 bg-white px-4 py-4 text-left transition hover:bg-muted sm:px-5"
        onClick={() => setIsOpen(true)}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
          <BrandLogo variant="icon" href="" className="h-6 w-6" />
        </span>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex min-w-0 flex-1 items-center rounded-full bg-muted px-4 py-3 text-[15px] font-medium text-muted-foreground shadow-[inset_0_0_0_1px_rgba(15,23,42,0.035)] transition hover:bg-white hover:text-foreground hover:shadow-[0_8px_22px_rgba(15,23,42,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label="Open composer to make a dua"
        >
          <span className="truncate">What dua would you like to make?</span>
        </button>
        <ActionIconTooltip label="Make dua">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(22,163,74,0.16)] transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-label="Open composer to make a dua"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
          </button>
        </ActionIconTooltip>
      </div>

      {isOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] bg-slate-950/35 px-0 py-0 backdrop-blur-[2px] sm:px-4 sm:py-20 lg:px-6 lg:py-24"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setIsOpen(false)
              }}
            >
              <div
                className="mx-auto flex min-h-full w-full max-w-2xl items-end sm:items-start sm:justify-center"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) setIsOpen(false)
                }}
              >
                <section
                  ref={dialogRef}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={titleId}
                  className="scrollbar-hide max-h-[calc(100svh-1rem)] w-full overflow-y-auto rounded-t-[2rem] border border-border bg-white p-4 shadow-[0_35px_120px_rgba(15,23,42,0.24)] sm:max-h-[calc(100svh-10rem)] sm:rounded-[2rem] sm:p-5"
                >
                  <div className="rounded-[1.7rem] border border-border bg-white p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div dir={isArabicComposer ? "rtl" : "ltr"} className={isArabicComposer ? "text-right" : undefined}>
                        <h2 id={titleId} className="text-xl font-semibold tracking-tight text-foreground">
                          {modalTitle}
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{modalDescription}</p>
                      </div>
                      <ActionIconTooltip label="Close">
                        <button
                          type="button"
                          onClick={() => setIsOpen(false)}
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-white text-muted-foreground transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label="Close composer"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </ActionIconTooltip>
                    </div>

                    <div className="mt-5">
                      <DuaForm
                        categories={categories}
                        turnstileSiteKey={turnstileSiteKey}
                        copy={copy}
                        onLanguageChange={setComposerLanguage}
                        onSuccess={() => setIsOpen(false)}
                      />
                    </div>
                  </div>
                </section>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
