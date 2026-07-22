import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, Bookmark } from "lucide-react"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { Button } from "@/components/ui/button"
import { DuaList } from "@/components/dua-list"
import { listMyBookmarks } from "@/app/actions/bookmarks"
import { signInHref } from "@/lib/auth-modal"
import { getServerUser } from "@/lib/server-user"

export default async function BookmarksPage() {
  const user = await getServerUser()
  if (!user) redirect(signInHref({ next: "/bookmarks" }))

  const result = await listMyBookmarks()
  const duas = "duas" in result ? result.duas : []

  return (
    <InnerPageLayout activePath="/bookmarks" contentClassName="max-w-2xl">
      <header className="border-b border-border/50 pb-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bookmark className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.03em]">Bookmarks</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {duas.length > 0
                ? `${duas.length} saved dua${duas.length === 1 ? "" : "s"}.`
                : "Duas you save appear here."}
            </p>
          </div>
        </div>
      </header>

      {duas.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-muted/45 p-5">
          <p className="text-sm font-semibold text-foreground">No bookmarks yet</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Tap the bookmark icon on any dua to save it here for later.
          </p>
          <Button asChild className="mt-4 rounded-full">
            <Link href="/">
              Go to home feed
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="-mx-4 border-t border-border/70 sm:-mx-5 lg:-mx-8">
          <DuaList
            duas={duas}
            emptyTitle="No bookmarks yet"
            emptyDescription="Tap the bookmark icon on any dua to save it here."
          />
        </div>
      )}
    </InnerPageLayout>
  )
}
