import { buildRssResponse } from "@/lib/rss-feed"

export const dynamic = "force-dynamic"

// Same feed as /feed.xml, but hashtags are stripped from the post text and
// emitted as separate <category domain="hashtag"> elements.
export async function GET() {
  return buildRssResponse({ feedPath: "/feed-tags.xml", stripHashtags: true })
}
