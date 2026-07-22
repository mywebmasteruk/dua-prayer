"use client"

import { Plus, Search, X } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"
import { HomeSearchInput } from "@/components/home-search-input"
import { useHomeSearch } from "@/components/home-search-provider"

interface MobileTopBarProps {
  /** Show the compose "+" button (only where a composer exists, e.g. the home feed). */
  showCompose?: boolean
}

/**
 * Mobile-only top bar: brand logo on the left, a search toggle and (optionally)
 * a compose button on the right. The full search field stays collapsed until
 * the search icon is tapped. Hidden on lg+ where the sidebar/rail take over.
 */
export function MobileTopBar({ showCompose = false }: MobileTopBarProps) {
  const { searchOpen, setSearchOpen, setComposeOpen } = useHomeSearch()

  return (
    <div className="lg:hidden">
      <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
        <BrandLogo variant="icon" href="/" showWordmark priority className="h-8 w-8 shrink-0" />
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label={searchOpen ? "Hide search" : "Search"}
            aria-expanded={searchOpen}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/70 bg-white text-muted-foreground transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {searchOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Search className="h-5 w-5" aria-hidden="true" />}
          </button>
          {showCompose ? (
            <button
              type="button"
              onClick={() => setComposeOpen(true)}
              aria-label="Share dua"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(22,163,74,0.16)] transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
      {searchOpen ? (
        <div className="border-b border-border/70 px-4 pb-3 pt-2">
          <HomeSearchInput />
        </div>
      ) : null}
    </div>
  )
}
