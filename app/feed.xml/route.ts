import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { getChannelHandle } from "@/lib/channels"
import { getRssSettings, type RssSettings } from "@/lib/rss-settings-server"

export const dynamic = "force-dynamic"

type DuaRow = {
  id: string
  text: string | null
  channel_id: string | null
  language: string | null
  created_at: string
}

type CategoryRow = {
  id: string
  name: string
  handle: string | null
  is_verified: boolean | null
  status: string | null
}

function xmlEscape(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value
  return `${value.slice(0, max - 1).trimEnd()}…`
}

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://duaprayer.com").trim().replace(/\/+$/, "")
}

function buildItemLink(siteUrl: string, dua: DuaRow, category: CategoryRow | undefined): string {
  if (category) {
    const handle = getChannelHandle({ name: category.name, handle: category.handle })
    return `${siteUrl}/channels/${handle}#dua-${dua.id}`
  }
  return `${siteUrl}/#dua-${dua.id}`
}

function disabledResponse(): Response {
  return new Response("RSS feed is not enabled.", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}

async function loadDuas(settings: RssSettings): Promise<{ duas: DuaRow[]; categoryById: Map<string, CategoryRow> }> {
  const admin = createAdminSupabaseClient()
  // Pull a bit more than we need so we can fairly merge sources before truncating.
  const fetchLimit = Math.min(50, Math.max(settings.itemCount * 2, settings.itemCount + 5))

  let query = admin
    .from("duas")
    .select("id, text, channel_id, language, created_at")
    .eq("published", true)
    .eq("flagged", false)
    .order("created_at", { ascending: false })
    .limit(fetchLimit)

  if (!settings.includeChannelPosts && settings.includeFreeformDuas) {
    query = query.is("channel_id", null)
  } else if (settings.includeChannelPosts && !settings.includeFreeformDuas) {
    query = query.not("channel_id", "is", null)
  }

  const { data: duaData, error } = await query
  if (error) {
    console.error("[feed.xml] dua query failed:", error)
    return { duas: [], categoryById: new Map() }
  }

  const duas = (duaData ?? []) as DuaRow[]
  const channelIds = Array.from(new Set(duas.map((d) => d.channel_id).filter((id): id is string => Boolean(id))))

  let categoryById = new Map<string, CategoryRow>()
  if (channelIds.length > 0) {
    const { data: catData, error: catError } = await admin
      .from("categories")
      .select("id, name, handle, is_verified, status")
      .in("id", channelIds)
    if (catError) {
      console.error("[feed.xml] category lookup failed:", catError)
    } else {
      categoryById = new Map((catData ?? []).map((c) => [c.id as string, c as CategoryRow]))
    }
  }

  const excluded = new Set(settings.excludedChannelIds)
  const filtered = duas.filter((d) => {
    if (!d.channel_id) return settings.includeFreeformDuas
    if (!settings.includeChannelPosts) return false
    if (excluded.has(d.channel_id)) return false
    const cat = categoryById.get(d.channel_id)
    if (!cat) return false
    if (cat.status !== "approved") return false
    if (settings.onlyVerifiedChannels && !cat.is_verified) return false
    return true
  })

  return { duas: filtered.slice(0, settings.itemCount), categoryById }
}

export async function GET() {
  const settings = await getRssSettings()
  if (!settings.enabled) return disabledResponse()
  if (!settings.includeChannelPosts && !settings.includeFreeformDuas) return disabledResponse()

  const siteUrl = baseUrl()
  const feedUrl = `${siteUrl}/feed.xml`
  const { duas, categoryById } = await loadDuas(settings)

  const channelTitle = settings.title || "DuaPrayer"
  const channelDescription = settings.description || "Latest duas from the DuaPrayer community."
  const lastBuildDate = (duas[0]?.created_at ? new Date(duas[0].created_at) : new Date()).toUTCString()

  const items = duas.map((dua) => {
    const category = dua.channel_id ? categoryById.get(dua.channel_id) : undefined
    const link = buildItemLink(siteUrl, dua, category)
    const titleSource = String(dua.text ?? "").replace(/\s+/g, " ").trim()
    const title = truncate(titleSource, 90) || "Dua"
    const description = truncate(titleSource, 500)
    const pubDate = new Date(dua.created_at).toUTCString()
    const categoryTag = category
      ? `<category>${xmlEscape(category.name)}</category>`
      : "<category>Dua</category>"

    return `    <item>
      <title>${xmlEscape(title)}</title>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="false">dua-${xmlEscape(dua.id)}</guid>
      <pubDate>${pubDate}</pubDate>
      ${categoryTag}
      <description>${xmlEscape(description)}</description>
    </item>`
  })

  const authorTag = settings.author ? `\n    <managingEditor>${xmlEscape(settings.author)}</managingEditor>` : ""
  const copyrightTag = settings.copyright ? `\n    <copyright>${xmlEscape(settings.copyright)}</copyright>` : ""

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(channelTitle)}</title>
    <link>${xmlEscape(siteUrl)}</link>
    <description>${xmlEscape(channelDescription)}</description>
    <language>${xmlEscape(settings.language)}</language>
    <ttl>${settings.ttlMinutes}</ttl>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${xmlEscape(feedUrl)}" rel="self" type="application/rss+xml" />${authorTag}${copyrightTag}
${items.join("\n")}
  </channel>
</rss>
`

  const maxAge = settings.ttlMinutes * 60
  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=${maxAge}`,
    },
  })
}
