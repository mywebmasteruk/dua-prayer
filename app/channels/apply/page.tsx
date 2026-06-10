import type { Metadata } from "next"
import { LayoutGrid } from "lucide-react"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { ChannelApplySection } from "@/components/channels/channel-apply-section"
import { getMyPendingChannelApplication } from "@/app/actions/channel-applications"
import { getChannelFilloutEmbedSrc } from "@/lib/site-settings-server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Apply for a channel — DuaPrayer",
  description:
    "Apply to open a community channel on DuaPrayer for imams, masjids, and community teams.",
}

async function ChannelApplyLoader() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [filloutSrc, pendingResult] = await Promise.all([
    getChannelFilloutEmbedSrc(),
    user ? getMyPendingChannelApplication() : Promise.resolve({ application: null }),
  ])

  const pendingChannelName =
    pendingResult && "application" in pendingResult ? pendingResult.application?.name ?? null : null

  return (
    <ChannelApplySection
      filloutSrc={filloutSrc}
      isSignedIn={!!user}
      userEmail={user?.email ?? null}
      pendingChannelName={pendingChannelName}
      inline
    />
  )
}

export default function ChannelApplyPage() {
  return (
    <InnerPageLayout activePath="/channels">
      <header className="border-b border-border/50 pb-8">
        <p className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
          <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
          Community channels
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Apply to open a channel</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          Apply to open a channel — we&apos;ll review your application. Approved channels appear in the feed,
          composer, and channel browser for members to follow.
        </p>
      </header>

      <ChannelApplyLoader />
    </InnerPageLayout>
  )
}
