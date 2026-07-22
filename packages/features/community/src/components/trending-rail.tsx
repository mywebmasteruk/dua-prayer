'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Hash } from 'lucide-react';

import { cn } from '@kit/ui/utils';

import { buildTrendingHashtags } from '../hashtags';
import type { Category, Dua } from '../types';

function compact(value: number) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

type Tab = 'hashtags' | 'topics';

export function TrendingRail({
  duas,
  categories,
  onSelectTag,
}: {
  duas: Dua[];
  categories: Category[];
  onSelectTag?: (tag: string) => void;
}) {
  const [tab, setTab] = useState<Tab>('hashtags');
  const hashtags = useMemo(() => buildTrendingHashtags(duas, 5), [duas]);
  const topics = useMemo(() => {
    const byId = new Map(categories.map((category) => [category.id, category]));
    const counts = new Map<number, { duas: number; ameens: number }>();

    for (const dua of duas) {
      if (dua.category_id == null) continue;
      const current = counts.get(dua.category_id) ?? { duas: 0, ameens: 0 };
      current.duas += 1;
      current.ameens += dua.likes ?? 0;
      counts.set(dua.category_id, current);
    }

    return [...counts.entries()]
      .map(([id, stats]) => ({
        id,
        name: byId.get(id)?.name ?? `Topic ${id}`,
        ...stats,
      }))
      .sort(
        (a, b) =>
          b.duas - a.duas || b.ameens - a.ameens || a.name.localeCompare(b.name),
      )
      .slice(0, 5);
  }, [categories, duas]);

  if (hashtags.length === 0 && topics.length === 0) return null;

  return (
    <aside className="rounded-xl border p-3">
      <p className="text-sm font-medium">Community activity</p>
      <div
        role="tablist"
        aria-label="Trending"
        className="bg-muted mt-3 flex gap-1 rounded-lg p-1"
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
              'flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              tab === item.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-2 space-y-0.5">
        {tab === 'hashtags' ? (
          hashtags.length > 0 ? (
            hashtags.map((hashtag, index) => {
              const content = (
                <>
                  <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-full text-xs">
                    {index === 0 ? (
                      <Hash className="size-3.5" aria-hidden="true" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {hashtag.label}
                    </span>
                    <span className="text-muted-foreground mt-0.5 block truncate text-xs">
                      {compact(hashtag.duas)} duas · {compact(hashtag.ameens)}{' '}
                      ameens
                    </span>
                  </span>
                </>
              );

              if (onSelectTag) {
                return (
                  <button
                    key={hashtag.tag}
                    type="button"
                    onClick={() => onSelectTag(hashtag.tag)}
                    className="hover:bg-muted flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left"
                  >
                    {content}
                  </button>
                );
              }

              return (
                <Link
                  key={hashtag.tag}
                  href={`/?tag=${encodeURIComponent(hashtag.tag)}`}
                  className="hover:bg-muted flex items-center gap-3 rounded-lg px-2 py-2"
                >
                  {content}
                </Link>
              );
            })
          ) : (
            <p className="text-muted-foreground px-2 py-6 text-center text-xs">
              No trending hashtags yet.
            </p>
          )
        ) : topics.length > 0 ? (
          topics.map((topic, index) => (
            <div
              key={topic.id}
              className="flex items-center gap-3 rounded-lg px-2 py-2"
            >
              <span className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-xs tabular-nums">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {topic.name}
                </span>
                <span className="text-muted-foreground mt-0.5 block truncate text-xs">
                  {compact(topic.duas)} duas · {compact(topic.ameens)} ameens
                </span>
              </span>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground px-2 py-6 text-center text-xs">
            No topics yet.
          </p>
        )}
      </div>
    </aside>
  );
}
