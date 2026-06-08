"use client"

import { useSearchParams } from "next/navigation"
import { useNavigation } from "@/components/navigation-provider"
import { useNavigationRouter } from "@/hooks/use-navigation-router"
import type { Category } from "@/lib/types/dua"
import { cn } from "@/lib/utils"

interface FeedFiltersProps {
  categories: Category[]
}

export function FeedFilters({ categories }: FeedFiltersProps) {
  const router = useNavigationRouter()
  const { isNavigating } = useNavigation()
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get("category") || "all"

  const onSelect = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") params.delete("category")
    else params.set("category", value)
    params.delete("page")
    const q = params.toString()
    router.push(q ? `/?${q}` : "/")
  }

  const pills = [{ id: "all", name: "All" }, ...categories.map((cat) => ({ id: cat.id.toString(), name: cat.name }))]

  return (
    <div
      className="scrollbar-hide flex gap-2 overflow-x-auto px-4 py-3 sm:px-5"
      role="tablist"
      aria-label="Filter duas by category"
    >
      {pills.map((pill) => {
        const isActive = activeCategory === pill.id
        return (
          <button
            key={pill.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(pill.id)}
            disabled={isNavigating}
            aria-busy={isNavigating && isActive}
            className={cn(
              "tap-feedback shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-transparent bg-muted/60 text-muted-foreground hover:border-primary/25 hover:bg-primary/10 hover:text-foreground",
            )}
          >
            {pill.name}
          </button>
        )
      })}
    </div>
  )
}
