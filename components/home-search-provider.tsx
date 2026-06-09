"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface HomeSearchContextValue {
  query: string
  setQuery: (query: string) => void
}

const HomeSearchContext = createContext<HomeSearchContextValue | null>(null)

export function HomeSearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("")

  return <HomeSearchContext.Provider value={{ query, setQuery }}>{children}</HomeSearchContext.Provider>
}

export function useHomeSearch() {
  const context = useContext(HomeSearchContext)
  if (!context) {
    throw new Error("useHomeSearch must be used within HomeSearchProvider")
  }
  return context
}
