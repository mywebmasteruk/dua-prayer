import { CommunityFeed } from '@kit/community/components';
import { buildTrendingHashtags } from '@kit/community/hashtags';
import {
  getCategories,
  getFeedDuas,
  getPostingMode,
  getSiteCopy,
} from '@kit/community/server/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { CommunityRightRailPortal } from '~/(marketing)/_components/community-shell-context';

export const generateMetadata = async () => {
  return {
    title: 'DuaPrayer',
    description:
      'A community space to share prayers and duas, make ameen, and support one another.',
  };
};

function getCategoryLeaderboard(
  categories: Awaited<ReturnType<typeof getCategories>>,
  duas: Awaited<ReturnType<typeof getFeedDuas>>['duas'],
) {
  const counts = new Map<number, { duas: number; ameens: number }>();

  for (const dua of duas) {
    if (dua.category_id == null) continue;
    const current = counts.get(dua.category_id) ?? { duas: 0, ameens: 0 };
    counts.set(dua.category_id, {
      duas: current.duas + 1,
      ameens: current.ameens + (dua.likes ?? 0),
    });
  }

  return categories
    .map((category) => ({
      id: category.id,
      name: category.name,
      duas: counts.get(category.id)?.duas ?? 0,
      ameens: counts.get(category.id)?.ameens ?? 0,
    }))
    .sort(
      (a, b) =>
        b.ameens - a.ameens || b.duas - a.duas || a.name.localeCompare(b.name),
    )
    .slice(0, 5);
}

async function Home() {
  const client = getSupabaseServerClient();
  const [{ duas, total }, categories, postingMode, copy, userResult] =
    await Promise.all([
      getFeedDuas({ offset: 0 }),
      getCategories(),
      getPostingMode(),
      getSiteCopy(),
      client.auth.getUser(),
    ]);

  const rightRail = {
    trendingHashtags: buildTrendingHashtags(duas),
    categoryLeaderboard: getCategoryLeaderboard(categories, duas),
    totalDuas: total,
    totalAmeens: duas.reduce((sum, dua) => sum + (dua.likes ?? 0), 0),
    categoryCount: categories.filter((item) => item.channel_type === 'category')
      .length,
    channelCount: categories.filter((item) => item.channel_type === 'user')
      .length,
  };

  return (
    <section id="requests" className="overflow-hidden">
      <CommunityRightRailPortal data={rightRail} />
      <CommunityFeed
        initialDuas={duas}
        total={total}
        categories={categories}
        postingMode={postingMode}
        copy={copy}
        showLanguagePrefsLink={Boolean(userResult.data.user)}
        variant="shell"
      />
    </section>
  );
}

export default Home;
