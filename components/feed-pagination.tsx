"use client"

import { AppLink } from "@/components/ui/app-link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface FeedPaginationProps {
  page: number
  total: number
  pageSize: number
  onPageChange?: (page: number) => void
}

export function FeedPagination({ page, total, pageSize, onPageChange }: FeedPaginationProps) {
  const searchParams = useSearchParams()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  if (totalPages <= 1) return null

  const buildHref = (p: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (p <= 1) params.delete("page")
    else params.set("page", String(p))
    const q = params.toString()
    return q ? `/?${q}` : "/"
  }

  if (onPageChange) {
    return (
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-full border-border/80 bg-background hover:bg-muted/60"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="rounded-full bg-background px-3 py-1 text-sm tabular-nums text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-full border-border/80 bg-background hover:bg-muted/60"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        asChild={page > 1}
        className="rounded-full border-border/80 bg-background hover:bg-muted/60"
      >
        {page > 1 ? (
          <AppLink href={buildHref(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
            Previous
          </AppLink>
        ) : (
          <span>
            <ChevronLeft className="h-4 w-4" />
            Previous
          </span>
        )}
      </Button>
      <span className="rounded-full bg-background px-3 py-1 text-sm tabular-nums text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        asChild={page < totalPages}
        className="rounded-full border-border/80 bg-background hover:bg-muted/60"
      >
        {page < totalPages ? (
          <AppLink href={buildHref(page + 1)}>
            Next
            <ChevronRight className="h-4 w-4" />
          </AppLink>
        ) : (
          <span>
            Next
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </Button>
    </div>
  )
}
