import { buildRssResponse } from '@kit/community/server/rss-feed';

export const dynamic = 'force-dynamic';

export async function GET() {
  return buildRssResponse({ feedPath: '/feed.xml' });
}
