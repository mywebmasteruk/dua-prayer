"use client"

import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useHomeSearch } from "./home-search-provider"

interface HomeSearchInputProps {
  className?: string
}

export function HomeSearchInput({ className }: HomeSearchInputProps) {
  const { query, setQuery } = useHomeSearch()

  return (
    <label className={cn("relative block", className)}>
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        type="search"
        placeholder="Search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-label="Search feed and channels"
        className="w-full rounded-full bg-white/70 py-2 pl-11 pr-4 text-sm text-foreground/75 placeholder:text-muted-foreground/65 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.04)] focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15 lg:text-[15px]"
      />
    </label>
  )
}
