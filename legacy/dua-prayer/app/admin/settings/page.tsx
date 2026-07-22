import { redirect } from "next/navigation"
import { Settings2 } from "lucide-react"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminSettingsHub } from "@/components/admin/admin-settings-hub"
import { isSettingsTabId } from "@/lib/admin-settings-tabs"
import { getCustomCodeForAdmin } from "@/app/actions/custom-code"
import { getSeoSettingsForAdmin } from "@/app/actions/seo"
import { getRssSettingsForAdmin } from "@/app/actions/rss"
import { getFooterLinksForAdmin } from "@/app/actions/footer-links"
import { SEO_DEFAULTS } from "@/lib/seo-settings-server"
import { getAllPageSeoForAdmin, PAGE_SEO_PAGES, PAGE_SEO_EMPTY, type PageSeoOverrides, type PageSeoSlug } from "@/lib/page-seo-server"
import { RSS_DEFAULTS } from "@/lib/rss-settings-server"
import { FOOTER_LINK_DEFAULTS } from "@/lib/footer-links-server"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { signInHref } from "@/lib/auth-modal"
import { getPostingModeForAdmin } from "@/lib/posting-settings"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

type PageProps = {
  searchParams: Promise<{ tab?: string }>
}

function ErrorPanel({ stage, error }: { stage: string; error: unknown }) {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-12">
      <h1 className="text-xl font-semibold text-foreground">Settings diagnostic</h1>
      <p className="text-sm text-muted-foreground">
        Stage <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{stage}</code> threw the following error.
      </p>
      <pre className="whitespace-pre-wrap break-words rounded-md bg-muted px-3 py-2 font-mono text-xs text-foreground">
        {message}
      </pre>
      {stack ? (
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted/60 px-3 py-2 font-mono text-[11px] leading-5 text-muted-foreground">
          {stack}
        </pre>
      ) : null}
    </div>
  )
}

export default async function AdminSettingsPage({ searchParams }: PageProps) {
  try {
    const [{ tab }, ctx] = await Promise.all([searchParams, getAdminContext()])

    if (!ctx) redirect(signInHref({ next: "/admin/settings" }))

    const canManageSettings = ctx.isFoundingAdmin || hasPermission(ctx, "manage_settings")

    if (!canManageSettings) {
      redirect(signInHref({ error: "not_admin" }))
    }

    async function safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
      try {
        return await fn()
      } catch (error) {
        console.error(`[admin/settings] ${label} failed:`, error)
        return fallback
      }
    }

    const emptyPageSeo = Object.fromEntries(
      PAGE_SEO_PAGES.map((p) => [p.slug, { ...PAGE_SEO_EMPTY }]),
    ) as Record<PageSeoSlug, PageSeoOverrides>

    const [postingMode, customCode, seoSettings, pageSeo, rssSettings, rssChannels, footerLinks] = await Promise.all([
      safe("getPostingModeForAdmin", () => getPostingModeForAdmin(), "public" as const),
      safe("getCustomCodeForAdmin", () => getCustomCodeForAdmin(), { header: "", footer: "" }),
      safe("getSeoSettingsForAdmin", () => getSeoSettingsForAdmin(), { ...SEO_DEFAULTS }),
      safe("getAllPageSeoForAdmin", () => getAllPageSeoForAdmin(), emptyPageSeo),
      safe("getRssSettingsForAdmin", () => getRssSettingsForAdmin(), { ...RSS_DEFAULTS }),
      safe("loadRssChannelOptions", async () => {
        const admin = createAdminSupabaseClient()
        const { data } = await admin
          .from("categories")
          .select("id, name")
          .eq("is_active", true)
          .eq("status", "approved")
          .order("name", { ascending: true })
        return (data ?? []) as Array<{ id: string; name: string }>
      }, [] as Array<{ id: string; name: string }>),
      safe("getFooterLinksForAdmin", () => getFooterLinksForAdmin(), []),
    ])

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://duaprayer.com").replace(/\/$/, "")
    const rssFeedUrl = `${appUrl}/feed.xml`

    return (
      <InnerPageLayout activePath="/admin/settings">
        <AdminPageHeader
          icon={Settings2}
          title="Settings"
          description="Posting rules, SEO & social sharing, and custom code."
        />

        <AdminSettingsHub
          initialTab={isSettingsTabId(tab) ? tab : "posting"}
          postingMode={postingMode}
          customCode={customCode}
          seoSettings={seoSettings}
          pageSeo={pageSeo}
          rssSettings={rssSettings}
          rssFeedUrl={rssFeedUrl}
          rssChannels={rssChannels}
          footerLinks={footerLinks}
          footerLinkDefaults={FOOTER_LINK_DEFAULTS}
          canManageSettings={canManageSettings}
        />
      </InnerPageLayout>
    )
  } catch (error) {
    if (error instanceof Error && (error as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) {
      throw error
    }
    console.error("[admin/settings] page render failed:", error)
    return <ErrorPanel stage="render" error={error} />
  }
}
