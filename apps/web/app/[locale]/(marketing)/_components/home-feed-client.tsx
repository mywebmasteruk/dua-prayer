'use client';

import { CommunityFeed } from '@kit/community/components';
import type { PostingMode } from '@kit/community/posting-settings';
import type { SiteCopy } from '@kit/community/site-copy';
import type { Category, Dua } from '@kit/community/types';

import { useCommunityRightRail } from './community-shell-context';

export function HomeFeedClient({
  initialDuas,
  total,
  categories,
  postingMode,
  copy,
  showLanguagePrefsLink,
}: {
  initialDuas: Dua[];
  total: number;
  categories: Category[];
  postingMode: PostingMode;
  copy: SiteCopy;
  showLanguagePrefsLink: boolean;
}) {
  const { composeOpen, setComposeOpen } = useCommunityRightRail();

  return (
    <CommunityFeed
      initialDuas={initialDuas}
      total={total}
      categories={categories}
      postingMode={postingMode}
      copy={copy}
      showLanguagePrefsLink={showLanguagePrefsLink}
      variant="shell"
      composeOpen={composeOpen}
      onComposeOpenChange={setComposeOpen}
    />
  );
}
