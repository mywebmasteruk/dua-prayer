import { buildRssResponse } from "@/lib/rss-feed"

export const dynamic = "force-dynamic"

export async function GET() {
  return buildRssResponse({ feedPath: "/feed.xml" })
}
