"use client"

interface NewDuasBannerProps {
  count: number
  onShow: () => void
  loading?: boolean
}

function formatBannerLabel(count: number) {
  return `Show ${count} new dua${count === 1 ? "" : "s"}`
}

export function NewDuasBanner({ count, onShow, loading = false }: NewDuasBannerProps) {
  if (count <= 0) return null

  return (
    <div className="sticky top-0 z-20 border-b border-primary/15 bg-primary/[0.08] backdrop-blur-sm">
      <div className="flex justify-center px-4 py-2 sm:px-5">
        <button
          type="button"
          onClick={onShow}
          disabled={loading}
          className="rounded-full px-4 py-1.5 text-sm font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
          aria-live="polite"
        >
          {loading ? "Loading…" : formatBannerLabel(count)}
        </button>
      </div>
    </div>
  )
}
