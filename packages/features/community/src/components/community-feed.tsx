'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@kit/ui/button';

import { getFeedDuas } from '../server/server-actions';
import type { Category, Dua } from '../types';
import { DuaForm } from './dua-form';
import { DuaList } from './dua-list';

interface CommunityFeedProps {
  initialDuas: Dua[];
  total: number;
  categories: Category[];
}

export function CommunityFeed({
  initialDuas,
  total,
  categories,
}: CommunityFeedProps) {
  const router = useRouter();
  const [duas, setDuas] = useState(initialDuas);
  const [loadedTotal, setLoadedTotal] = useState(total);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">DuaPrayer</h1>
        <p className="text-muted-foreground text-sm">
          Share a dua, browse the latest posts, and make ameen.
        </p>
      </header>

      <DuaForm
        categories={categories}
        onCreated={() => {
          startTransition(async () => {
            const next = await getFeedDuas({ offset: 0 });
            setDuas(next.duas);
            setLoadedTotal(next.total);
            router.refresh();
          });
        }}
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Latest duas</h2>
          <span className="text-muted-foreground text-xs tabular-nums">
            {loadedTotal} total
          </span>
        </div>

        <DuaList duas={duas} />

        {duas.length < loadedTotal ? (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  const next = await getFeedDuas({ offset: duas.length });
                  setDuas((current) => {
                    const seen = new Set(current.map((item) => item.id));
                    const merged = [...current];

                    for (const dua of next.duas) {
                      if (!seen.has(dua.id)) {
                        merged.push(dua);
                      }
                    }

                    return merged;
                  });
                  setLoadedTotal(next.total);
                });
              }}
            >
              {isPending ? 'Loading…' : 'Load more'}
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
