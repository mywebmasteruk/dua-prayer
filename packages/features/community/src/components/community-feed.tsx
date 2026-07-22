'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDeferredValue, useEffect, useState, useTransition } from 'react';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';

import type { PostingMode } from '../posting-settings';
import { getFeedDuas } from '../server/server-actions';
import type { SiteCopy } from '../site-copy';
import type { Category, Dua } from '../types';
import { DuaForm } from './dua-form';
import { DuaList } from './dua-list';

interface CommunityFeedProps {
  initialDuas: Dua[];
  total: number;
  categories: Category[];
  postingMode: PostingMode;
  copy: SiteCopy;
  channelId?: number | null;
  showFollowingTab?: boolean;
  showLanguagePrefsLink?: boolean;
}

function matchesSearch(dua: Dua, query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) return true;

  return (
    dua.text.toLowerCase().includes(normalized) ||
    (dua.category_name?.toLowerCase().includes(normalized) ?? false) ||
    (dua.channel_handle?.toLowerCase().includes(normalized) ?? false) ||
    (dua.channel_name?.toLowerCase().includes(normalized) ?? false)
  );
}

export function CommunityFeed({
  initialDuas,
  total,
  categories,
  postingMode,
  copy,
  channelId = null,
  showFollowingTab = true,
  showLanguagePrefsLink = false,
}: CommunityFeedProps) {
  const router = useRouter();
  const [tab, setTab] = useState<'latest' | 'following'>('latest');
  const [duas, setDuas] = useState(initialDuas);
  const [loadedTotal, setLoadedTotal] = useState(total);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setDuas(initialDuas);
    setLoadedTotal(total);
  }, [initialDuas, total]);

  const visibleDuas = deferredSearch.trim()
    ? duas.filter((dua) => matchesSearch(dua, deferredSearch))
    : duas;

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
          {showLanguagePrefsLink ? (
            <p className="text-muted-foreground text-xs">
              Prefer certain languages?{' '}
              <Link
                href="/home/settings"
                className="text-foreground font-medium underline-offset-2 hover:underline"
              >
                Update feed languages
              </Link>
            </p>
          ) : null}
        </header>
      ) : null}

      <DuaForm
        categories={categories}
        channelId={channelId}
        postingMode={postingMode}
        copy={copy}
        onCreated={() => reload(tab, 0)}
      />

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search loaded duas…"
          aria-label="Search loaded duas"
        />

        <DuaList
          duas={visibleDuas}
          emptyTitle={
            deferredSearch.trim()
              ? 'No matching duas'
              : tab === 'following'
                ? copy.homeFollowingEmptyTitle
                : copy.homeFeedEmptyTitle
          }
          emptyDescription={
            deferredSearch.trim()
              ? 'Try a different search, or load more from the feed.'
              : tab === 'following'
                ? copy.homeFollowingEmptyDescription
                : copy.homeFeedEmptyDescription
          }
          emptyCtaHref={
            !deferredSearch.trim() && tab === 'following'
              ? '/channels'
              : undefined
          }
          emptyCtaLabel={
            !deferredSearch.trim() && tab === 'following'
              ? copy.homeFollowingEmptyCta
              : undefined
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
