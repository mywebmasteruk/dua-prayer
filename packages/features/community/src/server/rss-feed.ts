import 'server-only';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import { extractHashtags } from '../hashtags';
import { getRssSettings } from './advanced-actions';

function xmlEscape(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function truncate(value: string, max: number) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

function siteBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://dua-prayer.vercel.app'
  ).replace(/\/$/, '');
}

function splitHashtags(text: string) {
  const tags = extractHashtags(text).map((item) => item.tag);
  let body = text;

  for (const tag of tags) {
    body = body.replace(new RegExp(`#${tag}`, 'gi'), ' ');
  }

  body = body
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { body, tags };
}

export async function buildRssResponse(options: {
  feedPath: string;
  stripHashtags?: boolean;
}) {
  const settings = await getRssSettings();

  if (!settings.enabled) {
    return new Response('RSS feed is not enabled.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const siteUrl = siteBaseUrl();
  const feedUrl = `${siteUrl}${options.feedPath}`;
  const admin = getSupabaseServerAdminClient();

  const { data: duas } = await admin
    .from('duas')
    .select('id, text, category_id, channel_id, user_id, created_at, language')
    .eq('published', true)
    .eq('flagged', false)
    .order('created_at', { ascending: false })
    .limit(settings.itemCount);

  const rows = duas ?? [];
  const lookupIds = [
    ...new Set(
      rows
        .flatMap((row) => [row.category_id, row.channel_id])
        .filter((id): id is number => id != null),
    ),
  ];

  const categoryById = new Map<
    number,
    { id: number; name: string; handle: string | null }
  >();

  if (lookupIds.length > 0) {
    const { data: categories } = await admin
      .from('categories')
      .select('id, name, handle')
      .in('id', lookupIds);

    for (const category of categories ?? []) {
      categoryById.set(category.id, category);
    }
  }

  const lastBuildDate = (
    rows[0]?.created_at ? new Date(rows[0].created_at) : new Date()
  ).toUTCString();

  const items = rows
    .map((dua) => {
      const channel = dua.channel_id
        ? categoryById.get(dua.channel_id)
        : undefined;
      const topic = dua.category_id
        ? categoryById.get(dua.category_id)
        : undefined;
      const link = channel?.handle
        ? `${siteUrl}/channels/${channel.handle}#dua-${dua.id}`
        : `${siteUrl}/#dua-${dua.id}`;

      const raw = String(dua.text ?? '');
      const { body, tags } = options.stripHashtags
        ? splitHashtags(raw)
        : { body: raw, tags: [] as string[] };
      const titleSource = body.replace(/\s+/g, ' ').trim();
      const title = truncate(titleSource, 90) || 'Dua';
      const description = truncate(titleSource, 500);
      const itemLanguage = dua.language?.trim() || 'en';
      const author = channel?.name
        ? channel.name
        : dua.user_id
          ? 'Anonymous'
          : 'DuaPrayer';

      const categoryValues = [topic?.name ?? 'Dua'];

      if (options.stripHashtags) {
        categoryValues.push(
          tags.length > 0 ? tags.map((tag) => `#${tag}`).join(' ') : '',
        );
        categoryValues.push(`lang:${itemLanguage}`);
      }

      const categoryTags = categoryValues
        .map((value) => `<category>${xmlEscape(value)}</category>`)
        .join('\n');

      return `<item>
<title>${xmlEscape(title)}</title>
<link>${xmlEscape(link)}</link>
<guid isPermaLink="false">dua-${dua.id}</guid>
<pubDate>${new Date(dua.created_at).toUTCString()}</pubDate>
<dc:creator>${xmlEscape(author)}</dc:creator>
<dc:language>${xmlEscape(itemLanguage)}</dc:language>
${categoryTags}
<description>${xmlEscape(description)}</description>
</item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
<title>DuaPrayer</title>
<link>${xmlEscape(siteUrl)}</link>
<description>Latest published duas from the DuaPrayer community</description>
<language>en</language>
<lastBuildDate>${lastBuildDate}</lastBuildDate>
<atom:link href="${xmlEscape(feedUrl)}" rel="self" type="application/rss+xml" />
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
