import { getRssSettings } from '@kit/community/server/advanced-actions';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

export const dynamic = 'force-dynamic';

function xmlEscape(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const settings = await getRssSettings();

  if (!settings.enabled) {
    return new Response('RSS feed is not enabled.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://dua-prayer.vercel.app'
  ).replace(/\/$/, '');

  const admin = getSupabaseServerAdminClient();
  const { data: duas } = await admin
    .from('duas')
    .select('id, text, category_id, channel_id, created_at, language')
    .eq('published', true)
    .eq('flagged', false)
    .order('created_at', { ascending: false })
    .limit(settings.itemCount);

  const items = (duas ?? [])
    .map((dua) => {
      const link = `${siteUrl}/#dua-${dua.id}`;
      const title = xmlEscape((dua.text ?? '').slice(0, 80));
      const description = xmlEscape(dua.text ?? '');

      return `<item>
<title>${title}</title>
<link>${link}</link>
<guid isPermaLink="false">dua-${dua.id}</guid>
<pubDate>${new Date(dua.created_at).toUTCString()}</pubDate>
${dua.language ? `<dc:language>${xmlEscape(dua.language)}</dc:language>` : ''}
<description>${description}</description>
</item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
<title>DuaPrayer</title>
<link>${siteUrl}</link>
<description>Latest published duas from the DuaPrayer community</description>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
    },
  });
}
