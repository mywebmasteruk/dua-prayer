import { CommunityFeed } from '@kit/community/components';
import {
  getCategories,
  getFeedDuas,
} from '@kit/community/server/actions';

export const generateMetadata = async () => {
  return {
    title: 'DuaPrayer',
    description:
      'A community space to share prayers and duas, make ameen, and support one another.',
  };
};

async function Home() {
  const [{ duas, total }, categories] = await Promise.all([
    getFeedDuas({ offset: 0 }),
    getCategories(),
  ]);

  return (
    <div className="container py-10">
      <CommunityFeed
        initialDuas={duas}
        total={total}
        categories={categories}
      />
    </div>
  );
}

export default Home;
