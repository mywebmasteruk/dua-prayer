'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  Activity,
  ArrowUpRight,
  HeartHandshake,
  LayoutGrid,
  MessageCircle,
  Users,
} from 'lucide-react';

import { Input } from '@kit/ui/input';
import { cn } from '@kit/ui/utils';

import type { TrendingHashtag } from '@kit/community/hashtags';

export type CategoryLeaderboardItem = {
  id: number;
  name: string;
  duas: number;
  ameens: number;
};

function compactNumber(value: number) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

const cardClass =
  'rounded-3xl border border-slate-200/70 bg-slate-50/60 p-4 shadow-sm';
const headingClass = 'text-xl font-bold tracking-[-0.03em] text-slate-950';
const bodyClass = 'text-sm leading-6 text-slate-600';

export function CommunityRightRail({
  trendingHashtags,
  categoryLeaderboard,
  totalDuas,
  totalAmeens,
  categoryCount,
  channelCount,
}: {
  trendingHashtags: TrendingHashtag[];
  categoryLeaderboard: CategoryLeaderboardItem[];
  totalDuas: number;
  totalAmeens: number;
  categoryCount: number;
  channelCount: number;
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'hashtags' | 'topics'>('hashtags');

  return (
    <div className="space-y-4">
      <form
        className="sticky top-0 z-10 bg-muted/40 py-1 backdrop-blur"
        onSubmit={(event) => {
          event.preventDefault();
          const query = search.trim();
          router.push(query ? `/?q=${encodeURIComponent(query)}` : '/');
        }}
      >
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search duas…"
          aria-label="Search duas"
          className="rounded-full bg-background"
        />
      </form>

      <section className={cardClass}>
        <h2 className={headingClass}>Trending</h2>
        <div
          role="tablist"
          aria-label="Trending"
          className="mt-3 flex gap-1 rounded-xl bg-muted p-1"
        >
          {(
            [
              { id: 'hashtags', label: 'Hashtags' },
              { id: 'topics', label: 'Topics' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                'flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                tab === item.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-3 space-y-1">
          {tab === 'hashtags' ? (
            trendingHashtags.length > 0 ? (
              trendingHashtags.map((hashtag, index) => (
                <Link
                  key={hashtag.tag}
                  href={`/?tag=${encodeURIComponent(hashtag.tag)}`}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-white/80"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {hashtag.label}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {compactNumber(hashtag.duas)} duas ·{' '}
                      {compactNumber(hashtag.ameens)} ameens
                    </span>
                  </span>
                </Link>
              ))
            ) : (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                No trending hashtags yet.
              </p>
            )
          ) : categoryLeaderboard.length > 0 ? (
            categoryLeaderboard.map((topic, index) => (
              <div
                key={topic.id}
                className="flex items-center gap-3 rounded-xl px-2 py-2"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground tabular-nums">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {topic.name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {compactNumber(topic.duas)} duas ·{' '}
                    {compactNumber(topic.ameens)} ameens
                  </span>
                </span>
              </div>
            ))
          ) : (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              No topics yet.
            </p>
          )}
        </div>
      </section>

      <section className={cardClass}>
        <div className="flex items-center justify-between gap-3">
          <h2 className={headingClass}>Start a dua channel</h2>
          <LayoutGrid
            className="h-4 w-4 text-muted-foreground/70"
            aria-hidden="true"
          />
        </div>
        <p className={`${bodyClass} mt-2`}>
          Create a shared space for a reputable imam, masjid, or organisation.
        </p>
        <Link
          href="/channels/apply"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Create a channel
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>

      <section className={cardClass}>
        <div className="flex items-center justify-between gap-3">
          <h2 className={headingClass}>Platform activity</h2>
          <Activity
            className="h-4 w-4 text-muted-foreground/70"
            aria-hidden="true"
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-6 rounded-2xl bg-slate-50 p-4">
          {[
            {
              icon: Users,
              label: 'Duas shared',
              value: compactNumber(totalDuas),
            },
            {
              icon: MessageCircle,
              label: 'Ameens',
              value: compactNumber(totalAmeens),
            },
            {
              icon: LayoutGrid,
              label: 'Channels',
              value: compactNumber(channelCount),
            },
            {
              icon: HeartHandshake,
              label: 'Topics',
              value: compactNumber(categoryCount),
            },
          ].map((signal) => {
            const SignalIcon = signal.icon;

            return (
              <div key={signal.label} className="min-w-0">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <SignalIcon
                    className="h-3.5 w-3.5 text-primary/70"
                    aria-hidden="true"
                  />
                  <p className="truncate text-[11px] font-medium leading-tight">
                    {signal.label}
                  </p>
                </div>
                <p className="mt-1 text-3xl font-bold tracking-tight text-foreground/85">
                  {signal.value}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
