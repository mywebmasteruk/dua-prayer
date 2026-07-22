import { CommunityFeed } from '@kit/community/components';
import {
  getCategories,
  getFeedDuas,
  getPostingMode,
  getSiteCopy,
} from '@kit/community/server/actions';

export const generateMetadata = async () => {
  return {
    title: 'DuaPrayer',
    description:
      'A community space to share prayers and duas, make ameen, and support one another.',
  };
};

async function Home() {
  const [{ duas, total }, categories, postingMode, copy] = await Promise.all([
    getFeedDuas({ offset: 0 }),
    getCategories(),
    getPostingMode(),
    getSiteCopy(),
  ]);

  return (
    <div className="container py-10">
      <CommunityFeed
        initialDuas={duas}
        total={total}
        categories={categories}
        postingMode={postingMode}
        copy={copy}
      />
    </div>
  );
}

export default Home;
