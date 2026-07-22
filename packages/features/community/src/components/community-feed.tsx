'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Suspense,
  useDeferredValue,
  useEffect,
  useState,
  useTransition,
} from 'react';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { cn } from '@kit/ui/utils';

import { matchesHashtag, normalizeHashtag } from '../hashtags';
import type { PostingMode } from '../posting-settings';
import { getFeedDuas } from '../server/server-actions';
import type { SiteCopy } from '../site-copy';
import type { Category, Dua } from '../types';
import { DuaForm } from './dua-form';
import { DuaList } from './dua-list';
import { TrendingRail } from './trending-rail';

interface CommunityFeedProps {
  initialDuas: Dua[];
  total: number;
  categories: Category[];
  postingMode: PostingMode;
  copy: SiteCopy;
  channelId?: number | null;
  showFollowingTab?: boolean;
  showLanguagePrefsLink?: boolean;
  /** Match the legacy 3-column home: no marketing header / inline trending. */
  variant?: 'default' | 'shell';
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

function CommunityFeedInner({
  initialDuas,
  total,
  categories,
  postingMode,
  copy,
  channelId = null,
  showFollowingTab = true,
  showLanguagePrefsLink = false,
  variant = 'default',
}: CommunityFeedProps) {
  const isShell = variant === 'shell';
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTag = normalizeHashtag(searchParams.get('tag') ?? '');
  const queryFromUrl = searchParams.get('q') ?? '';
  const [tab, setTab] = useState<'latest' | 'following'>('latest');
  const [duas, setDuas] = useState(initialDuas);
  const [loadedTotal, setLoadedTotal] = useState(total);
  const [search, setSearch] = useState(queryFromUrl);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    setSearch(queryFromUrl);
  }, [queryFromUrl]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setDuas(initialDuas);
    setLoadedTotal(total);
  }, [initialDuas, total]);

  const visibleDuas = duas.filter((dua) => {
    if (activeTag && !matchesHashtag(dua.text, activeTag)) return false;
    if (deferredSearch.trim() && !matchesSearch(dua, deferredSearch)) {
      return false;
    }
    return true;
  });

  const setTag = (nextTag: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    const normalized = nextTag ? normalizeHashtag(nextTag) : '';

    if (normalized) params.set('tag', normalized);
    else params.delete('tag');

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

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

  const filteredEmpty = Boolean(activeTag || deferredSearch.trim());

  return (
    <div
      className={
        isShell
          ? 'flex w-full flex-col'
          : 'mx-auto flex w-full max-w-2xl flex-col gap-8'
      }
    >
      {!channelId && !isShell ? (
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

      <div className={isShell ? 'border-b border-border/70 px-4 py-4' : undefined}>
        <DuaForm
          categories={categories}
          channelId={channelId}
          postingMode={postingMode}
          copy={copy}
          onCreated={() => reload(tab, 0)}
        />
      </div>

      <section className={isShell ? 'space-y-4 px-4 py-4' : 'space-y-4'}>
        <div
          className={
            isShell
              ? 'flex items-stretch border-b border-border/70'
              : 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'
          }
        >
          <div className={isShell ? 'flex flex-1' : 'flex gap-2'}>
            <Button
              type="button"
              size="sm"
              variant={
                isShell
                  ? 'ghost'
                  : tab === 'latest'
                    ? 'default'
                    : 'outline'
              }
              className={
                isShell
                  ? cn(
                      'h-12 flex-1 rounded-none border-b-2 border-transparent text-sm',
                      tab === 'latest' &&
                        'border-primary font-bold text-primary',
                    )
                  : undefined
              }
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
                variant={
                  isShell
                    ? 'ghost'
                    : tab === 'following'
                      ? 'default'
                      : 'outline'
                }
                className={
                  isShell
                    ? cn(
                        'h-12 flex-1 rounded-none border-b-2 border-transparent text-sm',
                        tab === 'following' &&
                          'border-primary font-bold text-primary',
                      )
                    : undefined
                }
                onClick={() => {
                  setTab('following');
                  reload('following', 0);
                }}
              >
                Following
              </Button>
            ) : null}
          </div>
          {!isShell ? (
            <span className="text-muted-foreground text-xs tabular-nums">
              {loadedTotal} total
            </span>
          ) : null}
        </div>

        {!isShell ? (
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search loaded duas…"
            aria-label="Search loaded duas"
          />
        ) : null}

        {!isShell ? (
          <TrendingRail
            duas={duas}
            categories={categories}
            onSelectTag={setTag}
          />
        ) : null}

        {activeTag ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              Showing duas tagged{' '}
              <span className="text-foreground font-medium">#{activeTag}</span>
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setTag(null)}
            >
              Clear tag
            </Button>
          </div>
        ) : null}

        {showLanguagePrefsLink && isShell ? (
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

        <DuaList
          duas={visibleDuas}
          onSelectTag={setTag}
          emptyTitle={
            filteredEmpty
              ? 'No matching duas'
              : tab === 'following'
                ? copy.homeFollowingEmptyTitle
                : copy.homeFeedEmptyTitle
          }
          emptyDescription={
            filteredEmpty
              ? 'Try a different search or tag, or load more from the feed.'
              : tab === 'following'
                ? copy.homeFollowingEmptyDescription
                : copy.homeFeedEmptyDescription
          }
          emptyCtaHref={
            !filteredEmpty && tab === 'following' ? '/channels' : undefined
          }
          emptyCtaLabel={
            !filteredEmpty && tab === 'following'
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

export function CommunityFeed(props: CommunityFeedProps) {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground mx-auto max-w-2xl py-10 text-sm">
          Loading feed…
        </div>
      }
    >
      <CommunityFeedInner {...props} />
    </Suspense>
  );
}
