import { CommunityFeed } from '@kit/community/components';
import {
  getCategories,
  getFeedDuas,
  getPostingMode,
  getSiteCopy,
} from '@kit/community/server/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

export const generateMetadata = async () => {
  return {
    title: 'DuaPrayer',
    description:
      'A community space to share prayers and duas, make ameen, and support one another.',
  };
};

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

  return (
    <div className="container py-10">
      <CommunityFeed
        initialDuas={duas}
        total={total}
        categories={categories}
        postingMode={postingMode}
        copy={copy}
        showLanguagePrefsLink={Boolean(userResult.data.user)}
      />
    </div>
  );
}

export default Home;
