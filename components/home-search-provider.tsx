"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { LangFilter } from "@/components/feed-filters"

interface HomeSearchContextValue {
  query: string
  setQuery: (query: string) => void
  /** Selected feed language — shared so the trending rail can filter too. */
  lang: LangFilter
  setLang: (lang: LangFilter) => void
}

const HomeSearchContext = createContext<HomeSearchContextValue | null>(null)

const VALID_LANGS: LangFilter[] = ["en", "ar", "es", "ur", "fr"]

export function HomeSearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("")
  const [lang, setLang] = useState<LangFilter>("all")

  // Initialize the language from the URL once on mount (?lang=ar etc.).
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("lang")
    if (param && VALID_LANGS.includes(param as LangFilter)) setLang(param as LangFilter)
  }, [])

  return (
    <HomeSearchContext.Provider value={{ query, setQuery, lang, setLang }}>{children}</HomeSearchContext.Provider>
  )
}

export function useHomeSearch() {
  const context = useContext(HomeSearchContext)
  if (!context) {
    throw new Error("useHomeSearch must be used within HomeSearchProvider")
  }
  return context
}
