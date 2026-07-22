'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@kit/ui/button';

import type { PostingMode } from '../posting-settings';
import { getFeedDuas } from '../server/server-actions';
import type { Category, Dua } from '../types';
import { DuaForm } from './dua-form';
import { DuaList } from './dua-list';

interface CommunityFeedProps {
  initialDuas: Dua[];
  total: number;
  categories: Category[];
  postingMode: PostingMode;
  channelId?: number | null;
  showFollowingTab?: boolean;
}

export function CommunityFeed({
  initialDuas,
  total,
  categories,
  postingMode,
  channelId = null,
  showFollowingTab = true,
}: CommunityFeedProps) {
  const router = useRouter();
  const [tab, setTab] = useState<'latest' | 'following'>('latest');
  const [duas, setDuas] = useState(initialDuas);
  const [loadedTotal, setLoadedTotal] = useState(total);
  const [isPending, startTransition] = useTransition();

  const reload = (nextTab: 'latest' | 'following', offset = 0) => {
    startTransition(async () => {
      const next = await getFeedDuas({
        offset,
        channelId: channelId ?? undefined,
        followingOnly: nextTab === 'following',
      });

      if (offset === 0) {
        setDuas(next.duas);
      } else {
        setDuas((current) => {
          const seen = new Set(current.map((item) => item.id));
          const merged = [...current];

          for (const dua of next.duas) {
            if (!seen.has(dua.id)) merged.push(dua);
          }

          return merged;
        });
      }

      setLoadedTotal(next.total);
      router.refresh();
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      {!channelId ? (
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">DuaPrayer</h1>
          <p className="text-muted-foreground text-sm">
            Share a dua, browse the latest posts, and make ameen.
          </p>
        </header>
      ) : null}

      <DuaForm
        categories={categories}
        channelId={channelId}
        postingMode={postingMode}
        onCreated={() => reload(tab, 0)}
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={tab === 'latest' ? 'default' : 'outline'}
              onClick={() => {
                setTab('latest');
                reload('latest', 0);
              }}
            >
              Latest
            </Button>
            {showFollowingTab ? (
              <Button
                type="button"
                size="sm"
                variant={tab === 'following' ? 'default' : 'outline'}
                onClick={() => {
                  setTab('following');
                  reload('following', 0);
                }}
              >
                Following
              </Button>
            ) : null}
          </div>
          <span className="text-muted-foreground text-xs tabular-nums">
            {loadedTotal} total
          </span>
        </div>

        <DuaList
          duas={duas}
          emptyTitle={
            tab === 'following' ? 'No followed channels yet' : 'No duas yet'
          }
          emptyDescription={
            tab === 'following'
              ? 'Follow channels to see their duas here.'
              : 'Be the first to share a dua with the community.'
          }
        />

        {duas.length < loadedTotal ? (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => reload(tab, duas.length)}
            >
              {isPending ? 'Loading…' : 'Load more'}
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
