import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getDuas, getCategories } from "@/app/actions/duas"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { DuaList } from "@/components/dua-list"
import { VerifiedChannelBadge } from "@/components/verified-channel-badge"
import { getChannelHandle } from "@/lib/channels"

function compactNumber(n: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>
}): Promise<Metadata> {
  const { handle } = await params
  const categories = await getCategories()
  const channel = categories.find((c) => getChannelHandle(c) === handle)
  if (!channel) return {}

  const description =
    channel.description?.trim() ||
    `Duas and collective ameen in ${channel.name.toLowerCase()}.`

  return {
    title: `${channel.name} — DuaPrayer`,
    description,
  }
}

export default async function ChannelPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { handle } = await params
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number.parseInt(pageParam ?? "1") || 1)

  const categories = await getCategories()
  const channel = categories.find((c) => getChannelHandle(c) === handle)
  if (!channel) notFound()

  const { duas, total, pageSize } = await getDuas({
    category: channel.id.toString(),
    page,
  })

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const isVerified = channel.is_verified && channel.status === "approved"

  return (
    <InnerPageLayout activePath="/channels" showFooter={false}>
      <div className="space-y-6">
        <Link
          href="/channels"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          All channels
        </Link>

        <div className="flex items-start gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary ring-1 ring-primary/15"
            aria-hidden="true"
          >
            {channel.name.trim().charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{channel.name}</h1>
              {isVerified ? <VerifiedChannelBadge className="h-5 w-5" /> : null}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">@{handle}</p>
            {channel.description?.trim() ? (
              <p className="mt-3 text-sm leading-6 text-foreground/90">{channel.description}</p>
            ) : null}
            <p className="mt-3 text-xs text-muted-foreground">
              {compactNumber(total)} {total === 1 ? "dua" : "duas"}
            </p>
          </div>
        </div>

        <div className="-mx-4 border-t border-border/70 sm:-mx-5 lg:-mx-8">
          <DuaList
            duas={duas}
            emptyTitle="No duas yet"
            emptyDescription="Be the first to share a dua in this channel."
          />
        </div>

        {totalPages > 1 ? (
          <nav
            aria-label="Channel pagination"
            className="flex items-center justify-between gap-3 border-t border-border/70 pt-4"
          >
            {currentPage > 1 ? (
              <Link
                href={
                  currentPage === 2
                    ? `/channels/${handle}`
                    : `/channels/${handle}?page=${currentPage - 1}`
                }
                className="rounded-full border border-border/70 px-4 py-1.5 text-sm font-medium text-foreground/80 transition hover:bg-muted/40"
              >
                ← Previous
              </Link>
            ) : (
              <span />
            )}
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            {currentPage < totalPages ? (
              <Link
                href={`/channels/${handle}?page=${currentPage + 1}`}
                className="rounded-full border border-border/70 px-4 py-1.5 text-sm font-medium text-foreground/80 transition hover:bg-muted/40"
              >
                Next →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </div>
    </InnerPageLayout>
  )
}
