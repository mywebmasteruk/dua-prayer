import Link from 'next/link';

import { ChannelList } from '@kit/community/components';
import {
  getChannels,
  getSiteCopy,
  listMyFollowIds,
} from '@kit/community/server/actions';
import { Button } from '@kit/ui/button';

export const generateMetadata = async () => {
  return {
    title: 'Channels',
    description: 'Browse community channels and follow spaces you care about.',
  };
};

async function ChannelsPage() {
  const [channels, followedIds, copy] = await Promise.all([
    getChannels(),
    listMyFollowIds(),
    getSiteCopy(),
  ]);

  return (
    <div className="space-y-6 px-4 py-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Channels</h1>
          <p className="text-muted-foreground text-sm">
            {copy.channelsPageSubtitle}
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/channels/apply" />}>
          Apply
        </Button>
      </header>
      <ChannelList channels={channels} followedIds={followedIds} />
    </div>
  );
}

export default ChannelsPage;
