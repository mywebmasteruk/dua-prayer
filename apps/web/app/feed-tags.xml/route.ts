import { buildRssResponse } from '@kit/community/server/rss-feed';

export const dynamic = 'force-dynamic';

/** Same feed as /feed.xml, with hashtags moved into <category> values. */
export async function GET() {
  return buildRssResponse({
    feedPath: '/feed-tags.xml',
    stripHashtags: true,
  });
}
