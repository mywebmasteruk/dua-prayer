import { ChannelList } from '@kit/community/components';
import {
  getChannels,
  listMyFollowIds,
} from '@kit/community/server/actions';

export const generateMetadata = async () => {
  return {
    title: 'Channels',
    description: 'Browse community channels and follow spaces you care about.',
  };
};

async function ChannelsPage() {
  const [channels, followedIds] = await Promise.all([
    getChannels(),
    listMyFollowIds(),
  ]);

  return (
    <div className="container mx-auto max-w-2xl space-y-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Channels</h1>
        <p className="text-muted-foreground text-sm">
          Follow community spaces and browse latest duas by channel.
        </p>
      </header>
      <ChannelList channels={channels} followedIds={followedIds} />
    </div>
  );
}

export default ChannelsPage;
