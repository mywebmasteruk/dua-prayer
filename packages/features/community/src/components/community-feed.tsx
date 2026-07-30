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
import { HomeComposer } from './home-composer';
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
  composeOpen?: boolean;
  onComposeOpenChange?: (open: boolean) => void;
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
  composeOpen,
  onComposeOpenChange,
}: CommunityFeedProps) {
  const isShell = variant === 'shell';
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTag = normalizeHashtag(searchParams.get('tag') ?? '');
  const queryFromUrl = searchParams.get('q') ?? '';
  const tabFromUrl = searchParams.get('tab');
  const [tab, setTab] = useState<'latest' | 'following'>(
    tabFromUrl === 'following' ? 'following' : 'latest',
  );
  const [duas, setDuas] = useState(initialDuas);
  const [loadedTotal, setLoadedTotal] = useState(total);
  const [search, setSearch] = useState(queryFromUrl);
  const deferredSearch = useDeferredValue(search);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSearch(queryFromUrl);
  }, [queryFromUrl]);

  useEffect(() => {
    setDuas(initialDuas);
    setLoadedTotal(total);
  }, [initialDuas, total]);

  useEffect(() => {
    if (tabFromUrl === 'following') {
      setTab('following');
      startTransition(async () => {
        const next = await getFeedDuas({
          offset: 0,
          channelId: channelId ?? undefined,
          followingOnly: true,
        });
        setDuas(next.duas);
        setLoadedTotal(next.total);
      });
    }
    // Intentionally run once for deep-linked Following tab.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const selectTab = (nextTab: 'latest' | 'following') => {
    setTab(nextTab);

    const params = new URLSearchParams(searchParams.toString());
    if (nextTab === 'following') params.set('tab', 'following');
    else params.delete('tab');

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    reload(nextTab, 0);
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

  const list = (
    <>
      {activeTag ? (
        <div className="flex flex-wrap items-center gap-2 px-4 text-sm sm:px-5">
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
        <p className="text-muted-foreground px-4 text-xs sm:px-5">
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
        variant={isShell ? 'shell' : 'default'}
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
        <div className="flex justify-center py-4">
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
    </>
  );

  if (isShell) {
    return (
      <div className="flex w-full flex-col">
        <div
          className="sticky top-0 z-20 flex bg-white/95 shadow-[0_1px_12px_rgba(15,23,42,0.035)] backdrop-blur"
          style={{ minHeight: 53 }}
          role="tablist"
          aria-label="Home stream"
        >
          {(
            [
              { id: 'latest', label: 'Feed' },
              ...(showFollowingTab
                ? [{ id: 'following' as const, label: 'Following' }]
                : []),
            ] as const
          ).map((item) => {
            const isActive = tab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => selectTab(item.id)}
                className={cn(
                  'relative flex flex-1 items-center justify-center px-4 text-[13px] transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:text-[15px] lg:text-[19px]',
                  isActive
                    ? 'font-bold text-primary'
                    : 'font-medium text-muted-foreground/75',
                )}
              >
                {item.label}
                {isActive ? (
                  <span
                    className="absolute bottom-0 left-1/2 h-0.5 w-16 -translate-x-1/2 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        {!channelId ? (
          <HomeComposer
            categories={categories}
            channelId={channelId}
            postingMode={postingMode}
            copy={copy}
            open={composeOpen}
            onOpenChange={onComposeOpenChange}
            hideInlineTrigger
            onCreated={() => reload(tab, 0)}
          />
        ) : (
          <div className="border-b border-border/70 px-4 py-4">
            <DuaForm
              categories={categories}
              channelId={channelId}
              postingMode={postingMode}
              copy={copy}
              onCreated={() => reload(tab, 0)}
            />
          </div>
        )}

        <div className="min-h-[280px] space-y-3">{list}</div>
      </div>
    );
  }

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
              onClick={() => selectTab('latest')}
            >
              Latest
            </Button>
            {showFollowingTab ? (
              <Button
                type="button"
                size="sm"
                variant={tab === 'following' ? 'default' : 'outline'}
                onClick={() => selectTab('following')}
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

        <TrendingRail
          duas={duas}
          categories={categories}
          onSelectTag={setTag}
        />

        {list}
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
