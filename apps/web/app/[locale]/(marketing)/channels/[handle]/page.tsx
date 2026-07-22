import { notFound } from 'next/navigation';

import { CommunityFeed } from '@kit/community/components';
import {
  getCategories,
  getChannelByHandle,
  getFeedDuas,
  getPostingMode,
  getSiteCopy,
} from '@kit/community/server/actions';

interface ChannelPageProps {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: ChannelPageProps) {
  const { handle } = await params;
  const channel = await getChannelByHandle(handle);

  if (!channel) {
    return { title: 'Channel' };
  }

  return {
    title: channel.name,
    description: channel.description || `Duas from @${channel.handle}`,
  };
}

async function ChannelPage({ params }: ChannelPageProps) {
  const { handle } = await params;
  const channel = await getChannelByHandle(handle);

  if (!channel) {
    notFound();
  }

  const [{ duas, total }, categories, postingMode, copy] = await Promise.all([
    getFeedDuas({ offset: 0, channelId: channel.id }),
    getCategories(),
    getPostingMode(),
    getSiteCopy(),
  ]);

  return (
    <div className="container space-y-6 py-10">
      <header className="mx-auto max-w-2xl space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{channel.name}</h1>
        <p className="text-muted-foreground text-sm">@{channel.handle}</p>
        {channel.description ? (
          <p className="text-sm leading-6">{channel.description}</p>
        ) : null}
      </header>

      <CommunityFeed
        initialDuas={duas}
        total={total}
        categories={categories}
        postingMode={postingMode}
        copy={copy}
        channelId={channel.id}
        showFollowingTab={false}
      />
    </div>
  );
}

export default ChannelPage;
